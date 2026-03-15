---
title: Techniques to Boost LLM latency in Production
date: 2026-03-15
description: Techniques to Boost LLM latency in Production
tags:
  - LLM
  - Transformers
  - KV Cache
  - Latency Optimisation
---
![]()

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
- Serving Long Prompts: document QA, RAG systems
- Handling Many Concurrent Users
- Generating Long Responses

---

