# Language Model Training Resource Expectation <!-- omit in toc -->

*Published on 2025-01-15 in [AI](../topics/ai.html)*

- [Inference](#inference)
  - [Precision Table:](#precision-table)
- [Model Trining Size and Memory Requirements](#model-trining-size-and-memory-requirements)
- [GPU Memory Capacity](#gpu-memory-capacity)
- [Computational Throughput and Time](#computational-throughput-and-time)
- [Estimating the Number of A100 GPUs](#estimating-the-number-of-a100-gpus)
- [Model Training memory estimation examples](#model-training-memory-estimation-examples)
  - [Example 1](#example-1)
  - [Example 2](#example-2)
- [Conclusion](#conclusion)

## Inference

**FP32** is typically used for training because of its higher precision, but it’s less efficient for inference due to the larger memory footprint.

Lower precision data types like **FP16**, **INT8**, and **INT4** are used for inference because they significantly reduce memory usage and computational cost without a substantial loss in model performance. FP4 is emerging in ultra-low precision settings and can reduce memory even further, though with more accuracy trade-offs.

### Precision Table:

| Precision | GPU Memory Multiplier | Example - 1B  |
|-----------|------------------------|--------------|
| FP32      | ×4                     | 4 GB         |
| FP16      | ×2                     | 2 GB         |
| FP8       | ×1.5                   | 1.5GB        |
| INT8      | ×1                     | 1 GB         |
| FP4       | ×0.75                  | 0.75 GB      |
| INT4      | ÷2                     | 0.5 GB       |

## Model Trining Size and Memory Requirements

A BERT model with **110 million parameters** (commonly referred to as BERT-base) requires a certain amount of memory for the following:

1. **Model Parameters:** Each parameter typically takes 4 bytes (32-bit precision). So, the parameter size is:  
  $$
  110M \times 4  \text{ bytes} = 440  \text{ MB}
  $$

2. **Optimizer States:** For most optimizers like Adam, two additional values are stored per parameter (momentum and variance estimates). 
     Different optimizers (**SGD**, **Adam**, **LAMB**) cause different memory usage:
     - **SGD**: Requires smaller memory compared to others as it doesn’t need additional parameters.
     - **Adam**: Stores additional parameters (**m** and **v** vectors) for each weight, leading to potentially double memory usage for gradients.
  
    The total memory required for the optimizer can be written as:  
  $$
  110M \times 2 \times 4  \text{ bytes} = 880  \text{ MB}
  $$


3. **Activation Memory:** The memory for intermediate activations will vary depending on the batch size, sequence length, and precision (e.g., FP32 vs FP16). A rough estimate for a typical sequence length of 512 and batch size of 32 could range from a few GBs to over 10 GB.

4. **Total Memory Requirement per GPU:** Summing up these factors, the total memory required for a batch can range between 10–15 GB or more, depending on optimizations (like gradient checkpointing or activation recomputation). Memory usage also depends on the training setup:
    
    - **Single-node vs. Multi-node setups** impact memory usage.
    - **Crossing multi-GPUs** (e.g., Data Parallel, Model Parallel, Pipeline Parallel) can also influence memory requirements.


In summary, for a 110M parameter BERT model:

- **Memory:**  
  1 A100 (40 GB or 80 GB) should be sufficient for memory needs, even with a reasonably large batch size.

- **Computation:**  
  If you want to train within a week, 1–8 A100 GPUs would likely suffice, depending on how fast you need the training to finish and how parallelized your training setup is.

For larger batch sizes, data parallelism, or speed considerations, scaling to multiple GPUs can further reduce training time.



## GPU Memory Capacity

An NVIDIA A100 GPU has two main memory variants:

- **40 GB version**  
- **80 GB version**

Given a rough estimate of needing 10–15 GB for model parameters, optimizer states, and activations per batch, the A100's memory would be sufficient to handle multiple batches in memory.

## Computational Throughput and Time

The number of GPUs required is also determined by the total compute time (FLOPs required for training). Here’s a simplified outline:

**Training Steps:** For BERT models, the total number of steps is typically in the range of 100,000–1,000,000 steps, depending on the dataset and training schedule.

**FLOPs per Forward/Backward Pass:** A rough estimate is that training BERT-base (110M parameters) involves about $3.3 \times 10^{12}$ FLOPs per forward/backward pass for a single sequence. For a batch of 32 sequences, it would be:  
  $$
  32 \times 3.3 \times 10^{12} = 1.056 \times 10^{14}  \text{ FLOPs per batch}
  $$

**A100 Performance:** An A100 GPU has a theoretical peak of $312  \text{ TFLOPs}$ for mixed precision (FP16) calculations. Assuming around 80% efficiency, the effective performance is approximately $250  \text{ TFLOPs}$.

**Time per Batch on 1 GPU:** For one batch, it would take:  
  $$
  \frac{1.056 \times 10^{14}  \text{ FLOPs}}{2.5 \times 10^{14}  \text{ FLOPs/second}} = 0.42  \text{ seconds per batch}
  $$

## Estimating the Number of A100 GPUs

If your goal is to complete the training in a reasonable time (say, 1 week or 168 hours), you can calculate the total number of GPUs needed as:

**Total Batches:** If you plan to run 1 million batches and each batch takes 0.42 seconds, the total time is:  
  $$
  1,000,000 \times 0.42  \text{ seconds} = 420,000  \text{ seconds} \approx 117  \text{ hours}
  $$

**Scaling with More GPUs:** To complete the training in 1 week (168 hours), the number of GPUs needed would be:  
  $$
  \frac{117  \text{ hours}}{168  \text{ hours}} \approx 0.7  \text{ GPUs}
  $$

  So, you could use 1 A100 GPU for this small-scale model, and it would be feasible within the week. However, using 8 GPUs would reduce the training time further by a factor of 8.

## Model Training memory estimation examples

### Example 1
- Fine-tuning a **1B model** with **FP16 precision**.
- **PEFT** assumes the adapter is **2%**.
- **Model quantization** is set to **INT8**.


| Modules                 | Fully fine-tuned | Partial fine-tuned (LoRA) | QLoRA (INT8) | QLoRA (FP8) | QLoRA (FP4) |
| ----------------------- | ---------------- | ------------------------- | ------------ | ----------- | ----------- |
| **Model Weights**       | 2 GB             | 2 GB                      | 1 GB         | 1.5 GB      | 0.75 GB     |
| **Gradient**            | 2 GB             | 0.04 GB                   | 0.04 GB      | 0.04 GB     | 0.04 GB     |
| **Optimizer States**    | 8 GB             | 0.16 GB                   | 0.16 GB      | 0.16 GB     | 0.16 GB     |
| **Others (Activation)** | Constant         | Constant                  | Constant     | Constant    | Constant    |
| **Adapter Weights**     | N/A              | 0.04 GB                   | 0.04 GB      | 0.04 GB     | 0.04 GB     |
| **Total**               | **12 GB**        | **2.24 GB**               | **1.24 GB**  | **1.78 GB** | **1.03 GB** |


### Example 2

The table below summarizes the memory requirements for a 13B model under different scenarios:

| **Aspect**                  | **FP32 (Standard)** | **FP16 (Mixed Precision)** | **FP8**    | **FP4**    | **INT8 (Quantized)** |
| --------------------------- | ------------------- | -------------------------- | ---------- | ---------- | -------------------- |
| **Model Parameters**        | 52 GB               | 26 GB                      | 19.5 GB    | 13 GB      | 13 GB                |
| **Optimizer States**        | 104 GB              | 52 GB                      | 39 GB      | 26 GB      | N/A (not stored)     |
| **Activation Memory**       | 50–80 GB            | 25–40 GB                   | 18–32 GB   | 12–24 GB   | 25–40 GB             |
| **Total Memory per GPU**    | \~206 GB            | \~103 GB                   | \~76–91 GB | \~51–63 GB | \~38–53 GB           |
| **Memory Reduction Factor** | 1×                  | \~2×                       | \~2.7×     | \~4×       | \~4–6×               |





## Conclusion

For a 110M parameter BERT model:

- **Memory:**  
  1 A100 (40 GB or 80 GB) should be sufficient for memory needs, even with a reasonably large batch size.

- **Computation:**  
  If you want to train within a week, 1–8 A100 GPUs would likely suffice, depending on how fast you need the training to finish and how parallelized your training setup is.

For larger batch sizes, data parallelism, or speed considerations, scaling to multiple GPUs can further reduce training time.