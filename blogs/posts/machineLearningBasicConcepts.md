# Machine Learning Basic Concepts <!-- omit in toc -->

*Published on 2025-03-12 in [AI](../topics/ai.html)*
- [Statistical and Foundational Techniques](#statistical-and-foundational-techniques)
  - [Independent and Dependent Variables](#independent-and-dependent-variables)
  - [Linear Regression](#linear-regression)
  - [Logistic Regression](#logistic-regression)
  - [Training and Testing Set](#training-and-testing-set)
  - [Underfitting and Overfitting](#underfitting-and-overfitting)
  - [Regularization](#regularization)
  - [Imbalanced Dataset](#imbalanced-dataset)
- [Supervised, Unsupervised, and Reinforecement Learning](#supervised-unsupervised-and-reinforecement-learning)
  - [Labeled Data](#labeled-data)
  - [Supervised Learning](#supervised-learning)
  - [Unsupervised Learning](#unsupervised-learning)
  - [Semisupervised Learning](#semisupervised-learning)
  - [Self-Supervised Learning](#self-supervised-learning)
  - [Reinforcement Learning](#reinforcement-learning)
- [NLP](#nlp)
  - [Encode-decode vs. Decode-only](#encode-decode-vs-decode-only)
  - [LSTM](#lstm)
  - [Transformer](#transformer)
  - [BERT](#bert)
- [LLM](#llm)
  - [Data cleaning process for training Data](#data-cleaning-process-for-training-data)
  - [KV caching](#kv-caching)
  - [Model Quantization](#model-quantization)
  - [BF16 vs. FP16](#bf16-vs-fp16)
  - [Finetuning](#finetuning)
    - [LoRA](#lora)
  - [RAG](#rag)
  - [Angentic RAG](#angentic-rag)
  - [Engineering](#engineering)
- [Recommender System Algorithms](#recommender-system-algorithms)
  - [CF](#cf)
  - [Explicit and Implicit Ratings](#explicit-and-implicit-ratings)
  - [Content-Based Recommender Systems](#content-based-recommender-systems)
  - [User-Based/Item-Based vs. Content-Based Recommender Systems](#user-baseditem-based-vs-content-based-recommender-systems)
  - [Matrix Factorization](#matrix-factorization)
- [Vision Algorithms](#vision-algorithms)
  - [CNN](#cnn)
  - [Transfer Learning](#transfer-learning)
  - [Generative Adversarial Networks](#generative-adversarial-networks)
  - [Additional Computer Vision Use Cases](#additional-computer-vision-use-cases)


# Statistical and Foundational Techniques

Fundamental statistical techniques you need to know and be able to explain

## Independent and Dependent Variables

In data science, **variables** usually refer to the features or data points used to train a model. **Independent variables** usually 
refer to the features or the inputs to the model. And the **dependent variables** refer to target outcome of the model. 

Let’s say we want to predict the price of an apple, and we have a dataset that includes weight, height, color, and price.

The independent variables (also called features) are things like weight, height, and color. And the dependent variable is the price, because the price depends on the apple conditions like height and weight.

For example, heavier or larger apples might be priced higher than smaller ones, so weight and height can help predict the price.

## Linear Regression

Linear regression is a basic **statistical method** used to model the relationship between one dependent variable and one or more (Multiple linear regression) independent variables. It tries to fit a straight line through the data that best predicts the output. 

**Linear Regression Function**

$$
\hat{y} = w x + b
$$

Where:

* $x$ is the input feature
* $w$ is the weight (slope)
* $b$ is the bias (intercept)
* $\hat{y}$ is the predicted output

Let's use previous example, if we are predicting apple prices based on weight, linear regression will find the line that best shows how price (y-axis) changes as weight (x-axis) changes.

![Figure 1: Linear Regression of Apple Price Prediction](./imgs/machinelearningconcepts/machineLearningbasicCocept_fig1.png)

When it comes to multiple variables and want to fit it by Linear regression. We will have two or more independent variables, the regression becomes to 3D or higher dimensions and show how the different variable affecting the apple price. 

**Multiple Linear Regression**

$$
\hat{y} = \sum_{i=1}^{n} w_i x_i + b
$$

Where:

* $x_1, x_2, \ldots, x_n$ are the input features
* $w_1, w_2, \ldots, w_n$ are the corresponding weights
* $b$ is the bias
* $\hat{y}$ is the predicted output

![Figure 2: Multiple Linear Regression of Apple Price Prediction](./imgs/machinelearningconcepts/fig2.png)

During the linear regression training process, we start with a random line and adjust it based on the sum of squared residuals (SSR). With each iteration, the SSR gets smaller and smaller until it stops at certain point, meaning we have found the best approximation the regression model can make.

## Logistic Regression

**Logistic regression** is used when we are sovling binary classification problem. Instead of fitting a straight line like Linear Regression, it fits an S-shaped curve (sigmoid function) that gives a probability between 0 and 1.

**Sigmoid Function**

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

Where:

* $z = w \cdot x + b$ in logistic regression
* $\sigma(z)$ gives a probability between 0 and 1


One of the important concept of Logistic regression is the evaluation metric, which called Area Under the ROC (Receiver Operating Characteristic) Curve (AUC)

![Figure 3: ROC Curve Example](./imgs/machinelearningconcepts/fig3.png)

The yellow line shows the model's performance, and the higher the curve above the dashed line means the better the model is classifying. 


## Training and Testing Set

For the apple dataset, if we want to check how well the model predicts prices for new apples, we first need to evaluate our model before it go live. That means splitting the data into a training set and a testing set. We only use the training set to train the model, while the testing set stays completely separate. This helps make sure the model isn’t *"cheating"* by just memorizing the answers. So we can break out 80% of the apple data to use for model training and then save 20% of the apple data for testing purpose. 

**Question:** How are we goning to evalute the model during training process?

We can have validation set, the validation set allows use to monitor the model's performance during the traininig process without *"formally"* evaluating it. So most of the time we sperate the data into three buckets, 80% of the data for training, 10% of the data for validating the model during training, and the rest of the data save for testing the model after training.


## Underfitting and Overfitting

The model is not perform well on real world dataset is very common. There could be many reasons behind it, such as the data might require some data cleaning and data analysis before training.

**Underfitting** happens when the model doesn't capture the patterns or relationships between the independent variables. In other words, it’s too simple and doesn’t fit the dataset well.

**Overfitting** happens when the model fits the training data too well. It performs great on the training set, but when tested on new data, like test set, the accuracy drops. 

## Regularization

Regularization is a technique used to reduce overfitting of ML models. Generally, regularization will create a damper on model weights/coefficient and won't let the model fit too deep on during the training process.

But there always have trade-off. When trying to improve ML model, we always trying to fix bias and variance. **Bias** refers to the overall inaccuracy of the model and can often be caused by the model too simple. **Variance** comes from the overfitting, when the model fits the training set too well. Regularization might cause a model to redus its variance (solve overfit problem) but might increase bias at the same time. So, we can’t just blindly set regularization to a high value. If it’s too strong, it can limit the model too much and cause underfitting. Regularization helps prevent overfitting, but it needs to be balanced.

**Common Regularization**

L1 regularization, also known as lasso regularization, is a type of regularization that <u>shrinks model parameters toward zero.</u> 

L2 regularization (also known as ridge regularization) <u> adds a penalty term to the objective function (optimization)</u> that is proportional to the square of the coefficients of the model. This penalty term shrinks the coefficients toward zero, but unlike L1 (lasso) regularization, it does not make any of the coefficients exactly equal to zero.

L2 regularization can help reduce overfitting and improve the stability of the model by keeping coefficients from becoming too large. Both L1 and L2 regularization are commonly used to prevent overfitting and improve the generalization of ML models.

## Imbalanced Dataset

Imbalanced dataset in ML refer to datasets in which some classes or categories outweigh others. There are several way to deal with imbalanced dataset.

**Data Augmentation**

Data Augmentation is to generate more examples for the ML model to train on. Such as rotating/flipping images. That can genreate more and more data and also a way to prevent overfitting.

**Oversampling**

Oversampling (in class balancing) often involves randomly duplicating samples from the minority class to balance the dataset. 

**Undersampling**

Undersampling means you remove some data from the majority class (e.g., take out some fresh apple data) so both classes are closer in size.

**Ensemble methods**

Ensemble methods can also be used to increase model performance when dealing with an imbalanced dataset.11 Each model in the ensemble can be trained on a different subset of the data and can help learn the nuances of each class better.

# Supervised, Unsupervised, and Reinforecement Learning

## Labeled Data

## Supervised Learning

## Unsupervised Learning

## Semisupervised Learning

## Self-Supervised Learning

## Reinforcement Learning

# NLP
## Encode-decode vs. Decode-only

**Encode-decode** models (T5, BART) use an encoder to process the input and compress it into a representation, then a decoder generates the output based on that representation. This is great for tasks like translation, summarization, or Q&A.

**Decode-only** models (GPT) don't have a separate encoder; they treat both input and output as a single sequence and generate the response autoregressively, predicting one token at a time based on the previous ones. But in decode-only models like GPT, every time the model generates the next token, it processes the **entire sequence of previous tokens**, including the prompt. This is due to how transformer self-attention works.


## LSTM
## Transformer
## BERT


# LLM

## Data cleaning process for training Data

## KV caching

**Question： Why first token (TTFT) always slower than the rest of the token generations?**

When generating the first token, the LLM must process the entire input prompt through all transformer layers. It computes the full set of key (K) and value (V) vectors for every token in the prompt, since there's no KV cache available at first round. This makes the first token generation significantly slower, especially with long prompts. 

However, once this is done, the model caches the computed K/V pairs. For the next tokens, it only needs to compute the query for the new token and reuse the cached K/V from previous steps, meaning it doesn't need to recompute the entire prompt again. This caching mechanism drastically reduces computation, making subsequent token generations much faster.


**Question： How kv caching save memory and computation?**

It avoids recalculating attention projections for previous tokens, reducing both redundant compute and memory usage—especially helpful for long text generation.


**Follow-up Question： Why vLLM makes it so fast?**

The vLLM innovated a new technique called **Pipelined KV Caching** to efficiently build the initial KV cache before the first token's generation phase. Also having a better KV memory management by using **PagedAttention (block-based)**. 


In addition, vLLM improves KV memory efficiency with PagedAttention, a block-based memory management system that allocates and reuses fixed-size KV cache blocks. This solves the memory fragmentation problem in traditional KV caching, enables efficient batching across sequences of different lengths, and supports high-throughput, low-latency inference at scale.

**Question： How batching save computation?**

Processing multiple inputs in parallel lets a model use hardware (like GPUs) more efficiently. It increases throughput and reduces per-sample overhead.


**Dynamic batching vs. Static batching**

Groups requests in real time to form batches whose size varies depending on incoming load, maximizing efficiency without waiting to accumulate full batches.

Predefined batch size is fixed. You wait until that batch size is reached before processing—simple but may cause latency if traffic is sparse.


## Model Quantization

Reducing model size by converting weights/activations to lower precision (e.g. float16 or int8) without significantly reducing accuracy—great for faster inference and lower memory usage.


## BF16 vs. FP16

BF16 and FP32 have the same exponent size, so they cover the same range of values, but BF16 has ~3.5× fewer mantissa bits, so it can't distinguish values that are close together as well as FP32 can.


**In Summary: **
FP16: More precise, but easily overflows or underflows.
BF16: Less precise, but can handle a much wider range, critical for gradients and activations during training.

| Aspect               | FP32                         | BF16                                      |
| -------------------- | ---------------------------- | ----------------------------------------- |
| Precision (mantissa) | 23 bits (\~7 decimal digits) | 7 bits (\~3 decimal digits)               |
| Range (exponent)     | Same                         | Same                                      |
| Precision loss       | ❌ Minimal                    | ✅ \~3–4× less precise                     |
| Impact on training   | N/A                          | **Often negligible** for LLMs, CNNs, etc. |


## Finetuning
### LoRA

Low-Rank Adaptation: fine-tunes only small low-rank matrices added to a big pretrained model, making adaptation far more efficient in terms of training time and memory.


What is RoPE?

Rotary Positional Embedding: a way to encode position information directly into attention mechanisms via rotating query/key vectors—improves long-range handling and extrapolation.


FFN?

Feed‑Forward Network: the fully connected layer inside a transformer block (between attention sublayers). It applies pointwise nonlinear transformations to enhance model capacity.


DPO/PPO/RLHF

PPO (Proximal Policy Optimization): RL algorithm that avoids large policy updates for stability.

RLHF (Reinforcement Learning from Human Feedback): Used for aligning LLMs with user preferences via reinforcement signals.

DPO (Direct Preference Optimization): A newer RL approach optimizing pairwise preferences more efficiently than RLHF.


## RAG

RAG is a retriever is the component that finds the most relevant documents or text chunks from a knowledge base based on a user’s query.

Basic Steps:

1. Encodes the query into a vector
     * Using a sentence embedding model (e.g., E5, MPNet, BERT)

2. Searches the vector database (e.g., FAISS, Qdrant, Weaviate)
     * Compares the query vector to document vectors
     * Finds the top-K most similar document chunks

3. Returns those documents
     * These will be passed to the LLM to use as context


## Angentic RAG

Agentic RAG is an evolution of standard RAG where the system behaves more like a reasoning agent.

Within Agentic RAG, there are multi step invloved, plan → retrieve → reason → refine. So it is like Automated + Thinking + Self-verification.


1. Agent sees ambiguity → plans:

     * Search for drug interactions

     * Retrieve cardiology + pharmacology documents

     * Cross-check Paxlovid ingredients

2. Agent calls retriever multiple times

3. Agent generates intermediate thoughts:

    * “Found a potential risk with Ritonavir and statins.”


## Engineering

OOM issue

Out-of-memory errors (OOM) happen when models or batches exceed GPU/CPU memory. Mitigate with smaller batches, mixed precision, gradient checkpointing, or model sharding.


API rate limit

APIs often limit requests per time frame. Handle it by batching calls, adding rate-limit retries/backoff, or caching frequent responses.


OOV problem during RAG system

Out-of-vocabulary tokens appear in retrieval-augmented generation (RAG) when user query contains terms unknown to the tokenizer. Mitigate with subword tokenization or dynamic vocab updates.


Chunking problem in RAG system

When retrieving long documents, you might chunk them arbitrarily—this can break context or split important passages. Use smart chunking (sentence/paragraph-aware) or sliding windows to preserve coherence.



# Recommender System Algorithms
## CF
## Explicit and Implicit Ratings
## Content-Based Recommender Systems
## User-Based/Item-Based vs. Content-Based Recommender Systems
## Matrix Factorization

# Vision Algorithms
## CNN
## Transfer Learning
## Generative Adversarial Networks
## Additional Computer Vision Use Cases

<!-- 

Supervised, Unsupervised, and Reinforcement Learning
Machine learning breaks down into three main types: supervised learning (learning from labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through rewards and penalties via interaction with an environment).

Labeled Data
This is data where each input has a corresponding ground-truth label—like apples with their known prices or emails labeled “spam”/“not spam.” It’s essential for supervising models in tasks like classification or regression.

Supervised Learning
You train a model on labeled data so it learns to map inputs to known outputs. Think predicting apple prices from weight/height or classifying images—models get direct feedback during training.

Unsupervised Learning
Here, data has no labels. Models explore structure on their own—like clustering apples into groups based on similarity or finding hidden patterns in purchase behavior.

Semisupervised Learning
This mixes a small amount of labeled data with a large amount of unlabeled data. It's useful when labels are expensive to get—models learn from both known examples and structure in the unlabeled data.

Self‑Supervised Learning
Models generate labels from the input itself—like masking words in a sentence and predicting them back. Used a lot in NLP (e.g. BERT) so models pretrain on huge unlabeled datasets with generated “supervision.”

Reinforcement Learning
In RL, an agent takes actions within an environment and receives rewards or penalties. Over time, it learns policies that maximize cumulative reward—used in games, robotics, or recommendation strategies.

NLP
Natural Language Processing handles human language. It includes tasks like sentiment analysis, translation, question answering, and more.

NLP Concepts
Key ideas include tokenization, embedding, attention mechanisms, sequence-to-sequence modeling, and evaluation metrics like perplexity or BLEU score.

LSTM
Long Short-Term Memory networks are a type of recurrent neural network (RNN) designed to remember long-range dependencies in text—useful before transformers became dominant.

Transformer
A neural architecture based on self-attention. Transformers can handle sequence relationships in parallel, scaling to enormous datasets and long-range dependencies more efficiently than RNNs.

BERT
Bidirectional Encoder Representations from Transformers—pretrained using masked language modeling and next-sentence prediction. BERT understands context from both sides of a token.

LLM
Large Language Models like GPT, LLaMA, etc.—trained on massive text corpora using transformer-based architectures. These models can generate and understand human-like text.

Data cleaning process for training Data
Cleaning involves removing noise, handling missing values, eliminating duplicates, standardizing formats, and normalizing or tokenizing features to ensure high‑quality input for training.

KV caching
Key-value caching stores intermediate transformer attention keys and values during inference—instead of recomputing them each time. This speeds up sequence generation.

How KV caching saves memory and computation?
It avoids recalculating attention projections for previous tokens, reducing both redundant compute and memory usage—especially helpful for long text generation.

How batching saves computation?
Processing multiple inputs in parallel lets a model use hardware (like GPUs) more efficiently. It increases throughput and reduces per-sample overhead.

Dynamic batching
Groups requests in real time to form batches whose size varies depending on incoming load, maximizing efficiency without waiting to accumulate full batches.

Static batching
Predefined batch size is fixed. You wait until that batch size is reached before processing—simple but may cause latency if traffic is sparse.

Model Quantization
Reducing model size by converting weights/activations to lower precision (e.g. float16 or int8) without significantly reducing accuracy—great for faster inference and lower memory usage.

Finetuning
Taking a pretrained model and training it further on your specific task or domain—this typically improves performance much faster than training from scratch.

LoRA
Low-Rank Adaptation: fine-tunes only small low-rank matrices added to a big pretrained model, making adaptation far more efficient in terms of training time and memory.

What is RoPE?
Rotary Positional Embedding: a way to encode position information directly into attention mechanisms via rotating query/key vectors—improves long-range handling and extrapolation.

FFN?
Feed‑Forward Network: the fully connected layer inside a transformer block (between attention sublayers). It applies pointwise nonlinear transformations to enhance model capacity.

DPO/PPO/RLHF
PPO (Proximal Policy Optimization): RL algorithm that avoids large policy updates for stability.

RLHF (Reinforcement Learning from Human Feedback): Used for aligning LLMs with user preferences via reinforcement signals.

DPO (Direct Preference Optimization): A newer RL approach optimizing pairwise preferences more efficiently than RLHF.

Engineering
OOM issue
Out-of-memory errors (OOM) happen when models or batches exceed GPU/CPU memory. Mitigate with smaller batches, mixed precision, gradient checkpointing, or model sharding.

API rate limit
APIs often limit requests per time frame. Handle it by batching calls, adding rate-limit retries/backoff, or caching frequent responses.

OOV problem during RAG system
Out-of-vocabulary tokens appear in retrieval-augmented generation (RAG) when user query contains terms unknown to the tokenizer. Mitigate with subword tokenization or dynamic vocab updates.

Chunking problem in RAG system
When retrieving long documents, you might chunk them arbitrarily—this can break context or split important passages. Use smart chunking (sentence/paragraph-aware) or sliding windows to preserve coherence.

Recommender System Algorithms
CF
Collaborative Filtering: users get recommendations based on what similar users liked.

Explicit and Implicit Ratings
Explicit: direct user feedback (stars or likes). Implicit: inferred behavior (clicks, watch time).

Content‑Based Recommender Systems
Recommend items based on similarity of item features (e.g., apples with similar sugar content or origin).

User‑Based/Item‑Based vs. Content-Based Recommender Systems
User-based CF: recommendations from similar users.
Item-based CF: find similar items to the ones a user already likes.
Content-based: match user preferences to content features directly.

Matrix Factorization
Technique to decompose user-item interaction matrix into latent factors (e.g., user and item embeddings) used for making recommendations more scalable and accurate.

Vision Algorithms
CNN
Convolutional Neural Networks: learn spatial hierarchies from images using convolutional filters—great for recognizing apples or other objects.

Transfer Learning
You take a pretrained vision model (like ResNet) and fine-tune it on your specific image dataset—it saves time and often gives better results.

Generative Adversarial Networks
GANs involve two competing networks—generator and discriminator—that learn to produce realistic synthetic data, like fake apple images or styles. -->