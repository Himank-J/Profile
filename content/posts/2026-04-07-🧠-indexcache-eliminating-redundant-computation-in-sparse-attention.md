---
title: "🧠 IndexCache: Eliminating Redundant Computation in Sparse Attention"
date: 2026-04-08
description: IndexCache is an architectural acceleration method designed
  specifically for DeepSeek Sparse Attention (DSA) models to eliminate redundant
  computations by caching and reusing token selections across consecutive layers
tags:
  - DSA
  - Sparse Attention
  - Index Cache
  - Memory Optimization
  - Latency
---
## Introduction

Large Language Models (LLMs) have become incredibly powerful—but they come with a fundamental challenge: scaling efficiently to long contexts.

Whether you're building document-heavy RAG systems, multi-step AI agents, or
enterprise pipelines (like claims processing), one inevitably hit the same wall - attention computation becomes expensive as input length grows.

In my previous blog — [Techniques to Boost LLM Latency in Production](https://himankj.com/#/blog/2026-03-14-techniques-to-boost-llm-latency-in-production)
 — I explored five key techniques that help reduce latency in real-world systems, focusing on system-level optimizations, better orchestration, caching strategies, and efficient model serving. Those techniques primarily targeted end-to-end pipeline improvements.

In this blog, we go one level deeper. Instead of optimizing around the model, we focus on optimizing within the model itself—specifically:

**"How attention computation inside transformers can be made more efficient"**

This is where recent innovations like **IndexCache** come into play.

Over the past few years, several optimizations have been proposed to tackle this. One of the most promising directions is Sparse Attention, where models focus only on the most relevant tokens instead of attending to everything.

But here’s the catch:

Even sparse attention has hidden inefficiencies.

In this blog, we’ll explore:

The core inefficiency in modern sparse attention systems
How DeepSeek Sparse Attention (DSA) attempts to solve it
And most importantly, how IndexCache pushes this idea further by eliminating redundant computation across layers

By the end, you’ll have a clear mental model of:
👉 where the real bottleneck lies
👉 why it exists
👉 and how IndexCache removes it elegantly

- - -

## Problem at Hand

At the heart of transformer models lies the attention mechanism, where each token interacts with every other token to build contextual understanding.

The issue?

> Attention Complexity=O(L^2)

Where 
𝐿 is the sequence length.

**Why is this a problem?**

Let’s take a simple example:

Input length = 100K tokens
Each token attends to 100K tokens

This results in: 100K × 100K = 10^10 interactions

**Clearly not scalable for real-world systems.**

To solve this, modern architectures use **Sparse Attention**, where instead of attending to all tokens, each token attends to only a small subset (top-k tokens). More on it in the next section.

- - -

## Proposed Solution

To understand the solution, we first need to briefly look at how modern sparse attention systems like **DeepSeek Sparse Attention (DSA)** work.

### DeepSeek Sparse Attention (DSA)

DSA is a practical implementation of sparse attention that balances efficiency and accuracy.

Instead of computing full attention, DSA:

* Uses an indexer to estimate token importance
* Selects top-k tokens for each query
* Applies attention only on those tokens

Instead of:

> Token A → attends to 100,000 tokens

We do:

> Token A → attends to top 64 (k) most relevant tokens

This reduces complexity to: O(L⋅k), k≪L

![](/content/uploads/dsa.png)

**What is the Indexer?**

The indexer is a lightweight proxy for attention scoring.

For a query token it computes relevance scores against all tokens using a multi-head ReLU-gated dot product. This produces a score vector, which is then used to select: TopK(scores)

Why use ReLU-based scoring?

Unlike softmax-based attention:

* No normalization
* No exponentiation
* Negative scores are discarded

Advantages - **Faster, Simpler and Good enough for ranking tokens**

**How attention is applied?**

Once top-k tokens are selected Standard attention is computed only on those tokens
This drastically reduces compute.

### But there’s a hidden cost

We know that to identify those top-k relevant tokens, the model uses a component called an indexer.

Here’s the problem:

> The indexer itself still compares every token with every other token.

Indexer Complexity = O(L^2)

Even though we optimized attention, Attention cost decreases and Indexer cost is still quadratic

And it gets worse:

👉 This indexer runs at every transformer layer

**Why this is wasteful?**

Transformer layers don’t behave randomly. They gradually refine representations, meaning: **Tokens important in one layer are very likely important in the next layer**

Core Insight

> We are recomputing almost the same top-k tokens again and again across layers.

This leads to Redundant computation, Increased latency and Higher inference cost

In summary, DSA successfully reduces attention cost, but shifts the bottleneck to the indexing step.

### Indexcache

![](/content/uploads/indexcache_layer_sharing_diagram.svg)

**Core Idea**

> Don’t recompute token importance at every layer, instead reuse it.

**Intuition**
Instead of running the indexer at every layer:

* Some layers compute top-k tokens (Full layers)
* Other layers reuse previously computed indices (Shared layers)

Instead of:

```
Layer 1 → compute top-k  
Layer 2 → compute top-k  
Layer 3 → compute top-k  
```

We do:

```
Layer 1 → compute top-k  
Layer 2 → reuse  
Layer 3 → reuse  
Layer 4 → recompute  
```

Why this is powerful?
IndexCache does:

* Eliminates redundant index computations
* Reduces overall complexity significantly
* Improves inference latency

IndexCache doesn’t:

* Change attention mechanism
* Modify model architecture significantly
* Require heavy retraining (in basic form)

- - -

## Working of Indexcache

At a high level, IndexCache modifies how the indexer is used across transformer layers.

Instead of treating every layer independently, it introduces controlled sharing of index computations across layers.

### Core Mechanism: Full vs Shared Layers

The fundamental idea behind IndexCache is to split transformer layers into two types:

1. Full Layers (F)

* Run the indexer normally
* Compute fresh top-k token indices
* Update the cache

2. Shared Layers (S)

* Skip indexer computation entirely
* Reuse indices from the most recent Full layer

Execution Flow

```
Layer 1 (F) → compute indices → cache  
Layer 2 (S) → reuse cached indices  
Layer 3 (S) → reuse cached indices  
Layer 4 (F) → recompute → update cache  
```

**What exactly is being cached?**

Not embeddings, not attention weights but only the top-k token indices. These top-k tokens are the only tokens considered for attention computation.

### Layer Selection Strategy

Which layers should be Full and which should be Shared?
One simple way is to use **Alternate layers → F S F S F S**

But this doesn’t work well because as different layers play different roles:

* Early layers → syntactic patterns
* Middle layers → semantic aggregation
* Late layers → reasoning/refinement

#### Training-Free Approach

This is the only place where layers are explicitly chosen.

1. In this approach we start with a baseline where all layers are considered as full layers

> F F F F F F F F   (all layers compute index)

2. Try converting one layer to Shared:

> Example: F F S F F F F F

3. Evaluate model performance (loss, accuracy, etc.)
4. If performance drop is small we can keep it or else we will revert back to full layer
5. Repeat this process layer by layer

Essentially we are doing a greedy search over layers to identify “Which layers can safely reuse indices without hurting accuracy?”

**Key Insight** - Sensitive layers should be full layers whereas redundant layers can be shared ones.

#### Training aware optimization

Here instead of training the indexer for one layer, we train it for multiple layers at once. We are telling the indexer:

> “Don’t specialize for one layer, instead learn a general notion of token importance that works across multiple layers.”

It makes it possible for one Full layer to serve multiple Shared layers reliably

In training-free we reuse indices from layer l for layer l+1. The indexer at layer 
l was trained to approximate Attention(l) but now we are extending this for next layer (Attention(l+1)) and next one (Attention(l+2)). **As we keep using Attention calculated for layer 1 across other layers the error starts accumulating.**

With Training-Aware we retrain the indexer so that it works well for multiple layers.

**How It Works**

1. Define Layer Groups

We group layers such that one Full layer will serve multiple Shared layers

```
Example:

Group 1: Layers [1, 2, 3, 4]
Group 2: Layers [5, 6, 7, 8]
```

\-> Layer 1 and 5 will be Full layers

2. Compute True Attention
   For each layer in a group, compute the actual attention distribution: A1, A2, A3, A4.
   These come from: softmax(QK^T)
3. Aggregate across layers

   > Average(Attention_1, Attention_2, Attention_3, Attention_4)

Why avg?

* Attention patterns across nearby layers are similar
* Averaging captures shared importance structure
* Reduces layer-specific noise

4. Train Indexer to Match This Target

Now the indexer is trained to approximate: A_avg
	​

5. Now we can use this indexer at inference. Because indexer was trained for all these layers, reuse is reliable

#### Complexity Reduction

Lets assume - 

Total layers = 𝑁
Full layers = 𝑀

Then:

> Indexer cost reduction ≈ 1−𝑀/𝑁

Example
Total layers = 32\
Full layers = 8  

→ 75% reduction in indexer computation

- - -

## Conclusion

As LLMs continue to scale to longer contexts and more complex workloads, the real challenge is no longer just model quality—it’s efficiently utilizing compute.

Sparse attention methods like DeepSeek Sparse Attention (DSA) take an important step by reducing the cost of attention itself. But as we’ve seen, this introduces a new bottleneck: the indexer, which still operates at quadratic complexity and is repeatedly executed across layers.

IndexCache addresses this inefficiency with a simple yet powerful insight:

Token importance is largely stable across layers—so we don’t need to recompute it every time.

By reusing top-k token selections across layers, IndexCache eliminates a significant portion of redundant computation without fundamentally changing the model architecture. The addition of training-aware optimization further strengthens this approach, enabling more aggressive reuse while maintaining accuracy.

Equally important is how IndexCache fits into the broader inference stack. It complements existing optimizations like KV Cache by targeting a different axis of inefficiency—depth instead of time—making it especially valuable for long-context and document-heavy applications.

---

🎉 If this explanation made you go “huh, that makes sense!” then you DEFINITELY need to subscribe!

I’m Himank, a SDE-III AI/ML Engineer at Google 🧑‍💻✨. I take all those mind-boggling, cutting-edge AI concepts and turn them into something that even your grandma would get.

Follow along if you’re ready to ride the AI wave and laugh your way to understanding! 🌊
