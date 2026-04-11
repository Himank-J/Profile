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

Whether you're building:

document-heavy RAG systems,
multi-step AI agents, or
enterprise pipelines (like claims processing),

you inevitably hit the same wall: attention computation becomes expensive as input length grows.

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

**Core Idea**

> Don’t recompute token importance at every layer—reuse it.

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
