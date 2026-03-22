---
title: Techniques to Boost LLM latency in Production
date: 2026-03-15
description: Techniques to Boost LLM latency in Production
tags:
  - LLM
  - Transformers
  - KV Cache
  - Latency Optimisation
  - Prefill&Decode
  - Speculative Decoding
image: /content/uploads/screenshot-2026-03-22-at-6.47.30 pm.png
---
![]()

## Introduction

Over the past couple of years, the default answer to improving LLM performance has been simple:

> “Throw more GPUs at it.”

But that approach doesn’t scale — not for startups, not for individual builders, and honestly, not even for large companies trying to stay cost-efficient.

What’s far more interesting is this:

> Some of the most capable open-source ecosystems today — like those around models from **DeepSeek** and **Qwen** — don’t just rely on brute-force compute.

They rely on smart system design and clever optimization strategies. These systems extract more performance from the same hardware by:

\- avoiding redundant computation
- restructuring workloads
- exploiting patterns in how language models actually behave

And the result?

👉 Faster responses
👉 Lower costs
👉 Better scalability

All without “burning millions on GPUs.”

In this post, we’re going to focus on one critical dimension:

> Latency — how fast your LLM responds

We’ll break down **5 practical, production-ready techniques** that can significantly boost latency for open-source models, and more importantly:

\- how they work internally
- when they actually make sense
- and how to think about them as a system, not isolated tricks

---

## First-Token Latency vs Throughput Separation

One of the biggest challenges in production LLM systems is balancing **how fast a response starts** vs **how many responses a system can serve at once**.

These two goals often conflict.

Optimizing for one can easily hurt the other. A common strategy used in large-scale AI systems is **separating first-token latency optimization from throughput optimization**.

When a user sends a prompt to an LLM, two different performance metrics matter:

#### First-Token Latency (FTL)

The time between sending the prompt and receiving the first generated token. This determines how responsive the system feels to the user.

> User sends prompt → 600ms later → first token appears

#### Throughput

The total number of tokens generated per second across all requests. This determines how many users your system can serve efficiently.

#### The Core Problem

Optimizing for first-token latency and throughput requires very different system strategies.

**Goal**: Fast first token; **Optimization Strategy**: Low batching, immediate execution

**Goal**: High throughput; **Optimization Strategy**: Large batching, shared compute

Because these goals conflict, many modern LLM serving systems **split the architecture into two stages**:

* Prompt Processing Stage (optimize for FTL)
* Token Generation Stage (optimize for throughput)

### Why This Technique Boosts Latency

The main delay in LLM systems usually occurs during prompt processing.

Prompt processing requires the model to:

1. Tokenize the prompt
2. Compute embeddings
3. Run the entire prompt through the transformer
4. Build the KV cache

This stage is computationally heavy and not easily batchable. Once the first token is generated, generation becomes much cheaper because the model reuses the KV cache.

So the process becomes:

Stage 1: Prompt Processing (expensive)
Stage 2: Token Generation (cheap incremental decoding)

If we treat both stages the same, we get inefficient scheduling.

Instead, production systems often:

*Stage 1 — Optimize for Fast Start*

* small batches
* immediate scheduling
* minimal queueing
* aggressive GPU allocation

> Goal: Get the first token as fast as possible

*Stage 2 — Optimize for High Throughput*

* Once generation begins:
* tokens can be batched across many requests
* GPU utilization increases
* token decoding can be interleaved

> Goal: Generate tokens for many users simultaneously

This dramatically improves system efficiency without hurting user-perceived latency.

### Internal Mechanism Behind the Speedup

![Transformer inference: two phases](/content/uploads/transformer_inference_phases.svg)

The speed improvement comes from how **transformer inference behaves computationally.**

#### Prompt Processing = Prefill Phase

The entire prompt is processed at once.

Cost roughly scales with: 

> O(prompt_length × model_size)

Large prompts cause **high GPU memory bandwidth and compute usage**.

#### Token Generation = Decode Phase

Each new token uses the previously computed KV cache. Now the cost becomes:

> O(model_size)

instead of

> O(prompt_length × model_size)

This means generation is much cheaper than prefill, making it ideal for batching.

This separation allows systems to treat the two phases differently.

### When Should You Use This Technique?

* Chat applications - Users care about instant responses.
* Systems with long responses: Long responses create large decoding workloads where batching provides huge benefits.
* High concurrency environments: If hundreds or thousands of users query the system simultaneously

### Key Concepts Behind This Technique

* Prefill Phase: The stage where the model processes the entire input prompt. This is the most computationally expensive stage.
* Decode Phase: The stage where the model generates tokens one by one, using cached attention states.
* KV Cache: Transformers store Key and Value attention tensors for previously processed tokens. This avoids recomputing the entire prompt for every new token.

- - -

## Prefill vs Decode phase optimization

In above section we put a lot of stress on separating system into Prefill and Decode phases, in this section we focus on strategies that helps optimise these phases.

**TL;DR**

Prefill Phase - The model processes the entire prompt in one forward pass.

Decode Phase - After prefill completes, the model starts generating new tokens one at a time.

The hardware behavior of these two phases is completely different - 

1. Prefill: Compute-heavy, parallelizable
2. Decode: Memory-bound, sequential

This means the same optimization strategy cannot efficiently serve both phases.

#### Bottlenecks

During prefill:

* large matrix multiplications dominate
* GPU compute cores are heavily used

During prefill, the attention layer computes interactions between all tokens in the prompt. For a prompt of length n, attention complexity is approximately: **O(n²)**

During decoding:

* computation per token is small
* memory access dominates
* sequential dependencies exist

During decoding, the model only computes attention for the new token. Instead of recomputing everything, it uses the KV cache.

The complexity becomes roughly: **O(n)**

### Practical Optimization Strategies

#### Prefill Optimizations

1. Large Prompt Batching

   * ![Prefill optimization: large prompt batching](/content/uploads/prefill_large_prompt_batching.svg)
   * Combine many prompts into one batch.
   * Benefit: Higher GPU utilization
2. Tensor Parallelism

   * ![Tensor parallelism](/content/uploads/tensor_parallelism.svg)
   * Split large model layers across multiple GPUs during prompt processing.
   * Benefit: parallel computation across devices
3. Efficient Prompt Tokenization

   * Reducing tokenization overhead improves prefill start time.

#### Decode Optimizations

1. Continuous Batching

   * ![Continuous batching](/content/uploads/screenshot-2026-03-15-at-4.42.30 pm.png)
   * Instead of waiting for full batches, systems dynamically add requests to decoding batches.
   * Benefit: keeps GPU busy during token generation
2. KV Cache Reuse

   * ![](/content/uploads/screenshot-2026-03-15-at-4.41.13 pm.png)
   * Reuse stored attention tensors to avoid recomputing past tokens.
   * Benefit: dramatically lower compute cost per token
3. Memory-Efficient Attention Kernels

   * Libraries like FlashAttention reduce memory bandwidth usage.
   * Benefit: faster decode operations

### When Should You Use This Technique?

* Serving Long Prompts: document QA, RAG systems
* Handling Many Concurrent Users
* Generating Long Responses

- - -

## KV-Cache Warmup Strategies

In transformer models, every token generates key and value tensors used by the attention mechanism. These are stored in memory as the KV cache.

During generation, the model uses this cache instead of recomputing attention for all previous tokens. 

A KV-cache warmup strategy takes this one step further, instead of building the cache during a user request, the system precomputes and stores it ahead of time.

Example:

Many prompts start with the same system instruction:

"You are a helpful AI assistant that answers questions clearly."

```
Without warmup:

Request arrives
→ model recomputes KV cache for system prompt
→ generation begins
```

```
With KV-cache warmup:

System prompt KV cache already stored
→ reuse cache immediately
→ generation begins faster
```

This eliminates repeated computation and reduces time to first token.

### Why This Technique Improves Latency

Prompt processing is often the most expensive step in LLM inference. If a shared prompt prefix exists across many requests, repeatedly recomputing it wastes compute cycles.

KV-cache warmup avoids this by reusing precomputed attention states.
Instead of:

```
Compute KV for:
system prompt + user prompt
```

The system only computes:

```
Compute KV for:
user prompt
```

The KV cache for the shared prefix is simply loaded from memory. This reduces the workload during the prefill phase, which directly lowers first-token latency.

### Types of KV-Cache Warmup Strategies

1. Static Prefix Cache: The system precomputes KV caches for known prompt prefixes which includes system instructions, safety prompts, RAG templates and even tool instructions. 

> Benefit: lower first-token latency

2. Prompt Template Caching: Many applications use prompt templates like: 

   "You are an expert financial analyst. Answer the following question." 

   Instead of recomputing this every time, the KV cache for the template can be stored. Only the dynamic parts of the prompt require computation.
3. Session-Level KV Reuse: In chat applications, conversation history grows with each turn. The KV cache from previous turns can be reused instead of recomputing the entire conversation.
4. Retrieval Prefix Caching (RAG Systems): Retrieval pipelines often reuse similar context chunks. If frequently retrieved documents appear repeatedly, their KV cache can be reused across requests. This can significantly accelerate retrieval-augmented generation pipelines.

- - -

## Chunked Prefill

Processing long prompts is one of the biggest sources of latency in LLM systems. This causes two problems:

* Long first-token latency
* GPU scheduling inefficiencies

Chunked prefill addresses this by breaking large prompts into smaller chunks that are processed incrementally, allowing the system to interleave prompt processing with other requests.

![](/content/uploads/chunked_prefill.svg)

Example prompt:

User prompt = 2000 tokens

```
Without chunking:

Process 2000 tokens in one large prefill pass
```

```
With chunked prefill:

Process tokens 1–256
Process tokens 257–512
Process tokens 513–768
...
```

Each chunk updates the KV cache incrementally, gradually building the context needed for generation.

This allows the system to pause and schedule other requests between chunks, improving GPU utilization.

### Why This Technique Improves Latency

Large prompts can monopolize GPU resources for a long time.

```
Request A → 3000 token prompt
Request B → 10 token prompt

# Without chunked prefill:
GPU processes entire 3000-token prompt first
Request B waits. This creates head-of-line blocking.

# With chunked prefill:
Process chunk of Request A
Switch to Request B
Resume Request A
```

The scheduler can interleave workloads so small prompts aren't delayed by large ones. The result:

* lower average latency
* better fairness across requests
* higher GPU utilization

### When Should You Use Chunked Prefill?

Chunked prefill becomes particularly valuable when prompts are very long or highly variable in length like RAG systems, Document QA or Multi-User AI Platforms.

### Key Concepts Behind This Technique

* Head-of-Line Blocking: A situation where a large request blocks smaller ones waiting behind it.

- - -

## Speculative Decoding

Generating text with large language models is inherently slow and sequential. Each token depends on the previous one. This makes decoding difficult to parallelize and limits how fast responses can be generated.

Speculative decoding breaks this bottleneck. It is a technique where:

1. A small, fast model (draft model) generates multiple candidate tokens
2. A large, accurate model (target model) verifies them in parallel
3. Accepted tokens are committed, rejected ones are recomputed

Instead of generating one token at a time, the system generates multiple tokens per step.

**Basic Workflow**

```
Without speculative decoding:

Large model generates:
Token 1 → Token 2 → Token 3 → Token 4
```

```
With speculative decoding:

Small model guesses:
Token 1, 2, 3, 4

Large model verifies them in one pass
```

This reduces the number of expensive forward passes of the large model.

### Why This Technique Improves Latency

The bottleneck in LLM inference is the decode phase, where tokens are generated sequentially. Each token requires:

* a forward pass through the model
* memory access to KV cache
* synchronization overhead

Speculative decoding reduces the number of large model invocations.

*Without Speculation*: 4 tokens → 4 large model forward passes

*With Speculation*: 4 tokens → 1 large model forward pass + small model work

Since the small model is much faster, the overall latency drops significantly.

**Net Effect**

* Fewer large-model calls → lower latency
* Parallel verification → faster decoding

### Internal Mechanism Behind the Speedup

Speculative decoding works by combining:

* probabilistic sampling
* parallel verification
* accept/reject logic

![](/content/uploads/speculative_decoding.svg)

**Step 1: Draft Model Generates Tokens**

A smaller model predicts a sequence:

```
t₁, t₂, t₃, t₄
```

**Step 2: Target Model Verifies**

The large model processes all tokens in parallel and computes probabilities.

**Step 3: Acceptance Check**

Tokens are accepted if they match the distribution of the large model.

Simplified logic:

If draft_token is likely under target model → accept

Else → reject and recompute

**Step 4: Continue Generation**

Accepted tokens are committed, and generation continues from the last valid token.

### When Should You Use Speculative Decoding?

This technique is highly effective in decode-heavy workloads.

* Long Text Generation
* High Throughput Systems
* When a Smaller Model is Available

### Practical Implementation Considerations

**Model Pair Selection**

The draft model should be significantly faster and have similar token distribution patterns. Poor alignment leads to high rejection rates.

**KV Cache Management**

Both models maintain their own KV caches. Efficient cache handling is critical for performance.

**Hardware Utilization**

The small model can run on:

* CPU
* separate GPU
* or shared GPU with scheduling

- - -

## My Recommendations for Top 2 strategies:

🥇 **1. Speculative Decoding (Most Impactful)**

This is the only technique that directly breaks the decode bottleneck, which is the biggest latency contributor in LLMs.

**Real Gains**

* 2–3× faster generation in practice
* ~60% reduction in token latency in real benchmarks

**Tradeoffs**

* Needs 2 models (draft + target)
* Requires GPU headroom
* Acceptance rate dependent

🥈 **2. Prefix Caching (System Prompt KV Reuse)**

This is exactly what we discussed in "KV-Cache Warmup Strategies" section. This gives massive first-token latency (TTFT) improvement, especially in real apps.

**Real Gains**

* Eliminates repeated prefill compute
* Can reduce TTFT drastically in agent workloads

**Tradeoffs**

* Cache invalidation is tricky
* Needs strict prompt consistency
* GPU memory pressure

- - -

## Conclusion

It’s easy to fall into the trap of obvious solutions:

* bigger models
* more GPUs
* more infrastructure

But the real leverage in LLM systems doesn’t come from scaling blindly. It comes from thinking smarter about computation.

The techniques we explored show a consistent pattern:

* Don’t recompute what you already know → Prefix caching, KV reuse
* Don’t block the system unnecessarily → Chunked prefill
* Don’t process tokens sequentially if you don’t have to → Speculative decoding
* Don’t treat all workloads the same → Prefill vs decode optimization

These strategies do more than just improve latency. They force you to understand:

```
how transformers actually compute
where time is really spent (prefill vs decode)
how memory, compute, and scheduling interact
```

And once you see that clearly, optimization stops being guesswork.

The goal isn’t just to make models faster. The goal is to make them efficient by design.

Because in the long run: **Smart systems > Expensive systems**

If you take one thing away from this post, let it be this:

Before scaling up your hardware, ask —
“Am I fully utilizing the computation I already have?”

That question alone will take you further than most optimizations ever will.

- - -

🎉 If this explanation made you go “huh, that makes sense!” then you DEFINITELY need to subscribe!

I’m Himank, a SDE-III AI/ML Engineer at Google 🧑‍💻✨. I take all those mind-boggling, cutting-edge AI concepts and turn them into something that even your grandma would get.

Follow along if you’re ready to ride the AI wave and laugh your way to understanding! 🌊
