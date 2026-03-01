# AWS Machine Learning Specialty <!-- omit in toc -->

*Published on 2025-03-12 in [AI](../topics/ai.html)*

- [Data Engineering](#data-engineering)
  - [Data Lakes and Storage](#data-lakes-and-storage)
    - [AWS S3](#aws-s3)
    - [AWS EFS](#aws-efs)
    - [AWS EBS](#aws-ebs)
  - [Data Warehousing \& Query](#data-warehousing--query)
    - [AWS Redshift](#aws-redshift)
    - [Amazon Athena](#amazon-athena-1)
    - [AWS DynamoDB](#aws-dynamodb)
    - [AWS RDS](#aws-rds)
    - [AWS OpenSearch](#aws-opensearch)
  - [Big Data \& ETL](#big-data--etl)
    - [AWS EMR](#aws-emr)
    - [AWS Batch](#aws-batch-1)
    - [AWS Glue](#aws-glue-1)
      - [AWS Glue Workflow](#aws-glue-workflow)
      - [AWS Glue Data Brew](#aws-glue-data-brew)
  - [Streaming Data](#streaming-data)
- [AWS Kinesis](#aws-kinesis)
  - [AWS Kinesis Data Sctreams](#aws-kinesis-data-sctreams)
  - [AWS Kinesis Data Firehouse](#aws-kinesis-data-firehouse)
  - [AWS Managed Service for Apache Flink](#aws-managed-service-for-apache-flink)
- [AWS EventBridge](#aws-eventbridge)
  - [Workflow Orchestration](#workflow-orchestration)
- [AWS MWAA (Airflow)](#aws-mwaa-airflow)
- [Machine Learning \& AI](#machine-learning--ai)
- [AWS SageMaker](#aws-sagemaker)
  - [SageMaker Feature Sotre](#sagemaker-feature-sotre)
  - [SageMaker Containers](#sagemaker-containers-1)
  - [SageMaker Model Monitor](#sagemaker-model-monitor-1)
  - [SageMaker Endpoint Auto Scalling](#sagemaker-endpoint-auto-scalling)
  - [SageMaker Processing](#sagemaker-processing-1)
  - [SageMaker Data Wrangler](#sagemaker-data-wrangler-1)
  - [SageMaker Deep AR](#sagemaker-deep-ar)
  - [SageMaker JumpStart](#sagemaker-jumpstart-1)
  - [Prebuilt ML Services (AI APIs)](#prebuilt-ml-services-ai-apis)
- [AWS Comprehend](#aws-comprehend)
- [AWS Rekognition](#aws-rekognition)
- [Amazon Personalize](#amazon-personalize-1)
- [Amazon Bedrock](#amazon-bedrock-1)
- [Amazon Forecast](#amazon-forecast-1)
- [Amazon Transcribe](#amazon-transcribe-1)
- [Amazon Polly](#amazon-polly-1)
- [Amazon Lex](#amazon-lex-1)
- [AWS Mechanical Turk](#aws-mechanical-turk)
- [Amazon Q](#amazon-q-1)
- [Security, Monitoring, Governance](#security-monitoring-governance)
  - [IAM role](#iam-role)
  - [Enable Amazon Macie](#enable-amazon-macie)
  - [AWS KMS](#aws-kms)
  - [AWS X-Ray](#aws-x-ray-1)
  - [AWS CouldWatch](#aws-couldwatch)
  - [AWS CloudTrail](#aws-cloudtrail-1)
- [Compute \& Container Services](#compute--container-services)
  - [AWS Fargate](#aws-fargate)
  - [AWS ECS](#aws-ecs)
  - [AWS EKS](#aws-eks)
  - [AWS Lambda](#aws-lambda)
    - [Lambda Auto Scalling](#lambda-auto-scalling)
- [IoT \& Edge](#iot--edge)
  - [AWS IoT Analytics](#aws-iot-analytics)
  - [AWS IoT Core](#aws-iot-core)
- [Concepts](#concepts)
  - [Handling outliers](#handling-outliers)
    - [Z-score](#z-score)
    - [IQR](#iqr)
    - [Isolation Forest](#isolation-forest)
  - [Feature Binning (Discretization)](#feature-binning-discretization)
    - [Fixed Width Binning](#fixed-width-binning)
    - [Quantile Binning](#quantile-binning)
    - [K-means Binning](#k-means-binning)
  - [Deployment Strategies](#deployment-strategies)
    - [Multi-AZ Deployment](#multi-az-deployment)
    - [Multi-Region Deployment](#multi-region-deployment)
    - [Blue-Green Deployment](#blue-green-deployment)
    - [Canary Deployment](#canary-deployment)
  - [Synthetic Feature Creation](#synthetic-feature-creation)
    - [Polynomial Features](#polynomial-features)
    - [Feature Interaction](#feature-interaction)
    - [Log Trasform](#log-trasform)
  - [Gradient Descent Variants](#gradient-descent-variants)
    - [Batch Gradient Descent](#batch-gradient-descent)
    - [SGD](#sgd)
    - [Mini-batch Gradient Descent](#mini-batch-gradient-descent)
    - [Adam](#adam)
  - [Regularization Techniques](#regularization-techniques)
    - [L1](#l1)
    - [L2](#l2)
    - [Elastic Net](#elastic-net)
  - [Corss Validation](#corss-validation)
    - [K-Fold CV](#k-fold-cv)
    - [Statified K-Fold](#statified-k-fold)
    - [Leave One Out CV](#leave-one-out-cv)
  - [Model Initialization](#model-initialization)
    - [Random Initialization](#random-initialization)
    - [Xavier Initialization](#xavier-initialization)
    - [He Initialization](#he-initialization)
  - [Learning Rate](#learning-rate)
    - [Fixed Learning Rate](#fixed-learning-rate)
    - [Decay Learning Rate](#decay-learning-rate)
    - [Adaptive Learning Rate](#adaptive-learning-rate)
  - [Regression Metrics](#regression-metrics)
    - [MAE](#mae)
    - [MSE](#mse)
    - [RMSE](#rmse)
    - [R squre score](#r-squre-score)
    - [Confusion Matrix](#confusion-matrix)
- [Model Selections](#model-selections)
  - [XGBoost](#xgboost)
  - [Logistic Regression](#logistic-regression)
  - [Linear Regression](#linear-regression)
  - [Decision Trees](#decision-trees)
  - [Random Forests](#random-forests)
  - [K-Means](#k-means)
  - [RNN](#rnn)
  - [CNN](#cnn)
  - [Ensemble Models](#ensemble-models)
  - [Transfer Learning](#transfer-learning)
  - [LLM](#llm)
- [AWS](#aws)



## 📊 Data Engineering

### 🪣 Data Lakes & Storage

#### **Amazon S3**

The backbone of AWS data lakes. **Object storage** that’s cheap, durable (11 nines), and infinitely scalable.

* **Use for**: Storing raw training data, processed features, and model artifacts.
* **Pros**: Low cost, integrates with nearly every AWS service.
* **Cons**: Higher latency than block/file storage.
* **Instead of**: Choose S3 over EFS/EBS when dealing with **massive datasets** and archive storage.

---

#### **Amazon EFS**

A **shared file system (NFS)** for multiple EC2 or SageMaker instances.

* **Use for**: Training jobs that need shared file access.
* **Pros**: Elastic, POSIX-compliant.
* **Cons**: Pricier than S3, higher latency than EBS.
* **Instead of**: Use EFS over S3 when you need **POSIX semantics and shared access**.

---

#### **Amazon EBS**

**Block storage** attached to EC2.

* **Use for**: High-performance, low-latency workloads like fast training data access.
* **Pros**: High IOPS, low latency.
* **Cons**: Tied to a single AZ, not shared.
* **Instead of**: Use EBS when you need **fast, random access** storage.

---

### 🏛 Data Warehousing & Query

#### **Amazon Redshift**

A **columnar, distributed data warehouse** for analytics.

* **Use for**: OLAP queries on structured features (petabytes).
* **Pros**: Fast, scalable, integrates with BI tools.
* **Cons**: Not good for OLTP.
* **Instead of**: Use Redshift over RDS when queries are **analytical, not transactional**.

---

#### **Amazon Athena**

**Serverless SQL** queries directly on S3.

* **Use for**: Ad-hoc exploration of raw datasets.
* **Pros**: No infrastructure, pay-per-query.
* **Cons**: Slower than Redshift for heavy workloads.
* **Instead of**: Use Athena over Redshift when queries are **occasional** and data is already in S3.

---

#### **Amazon DynamoDB**

A **serverless NoSQL key–value DB**.

* **Use for**: Millisecond-latency lookups at scale (e.g., real-time features).
* **Pros**: Scales automatically, highly available.
* **Cons**: Limited query flexibility.
* **Instead of**: Use DynamoDB when you need **speed and scale** without joins.

---

#### **Amazon RDS**

Managed **relational database** (Postgres, MySQL, etc.).

* **Use for**: OLTP, metadata storage, small training datasets.
* **Pros**: Familiar SQL, managed backups.
* **Cons**: Doesn’t scale to petabytes.
* **Instead of**: Use RDS when you need **transactions or complex joins**.

---

#### **Amazon OpenSearch**

Search + analytics engine.

* **Use for**: Full-text search, log analysis, anomaly detection.
* **Pros**: Real-time search.
* **Cons**: Costly, ops overhead at scale.
* **Instead of**: Use OpenSearch when you need **search**, not BI analytics.

---

### 🛠 Big Data & ETL

#### **Amazon EMR**

Managed **Hadoop/Spark clusters**.

* **Use for**: Processing terabytes of data, distributed feature engineering.
* **Pros**: Flexible, Spark ecosystem.
* **Cons**: Cluster management overhead.
* **Instead of**: Use EMR over Glue for **custom Spark MLlib or heavy ETL**.

---

#### **AWS Batch**

Run **batch jobs** on EC2/ECS.

* **Use for**: Batch training or inference jobs.
* **Pros**: Optimized scheduling, spot integration.
* **Cons**: Higher setup vs Lambda.
* **Instead of**: Use Batch when workloads are **long-running and compute-heavy**.

---

#### **AWS Glue**

Serverless ETL service.

* **Use for**: Cleaning and transforming datasets.
* **Pros**: Serverless, Data Catalog integration.
* **Cons**: Less control vs EMR.
* **Instead of**: Use Glue for **simpler ETL without cluster management**.

**Subservices:**

* **Glue Workflow** → orchestrate ETL jobs.
* **Glue DataBrew** → visual, no-code data prep for analysts.

---

### ⚡ Streaming Data

#### **Kinesis Data Streams**

Real-time event ingestion (like Kafka).

* **Use for**: Clickstream, IoT data, multiple consumers.
* **Pros**: Sub-second latency.
* **Cons**: Manual shard management.
* **Instead of**: Use Streams when you need **real-time processing**.

---

#### **Kinesis Data Firehose**

Managed data delivery.

* **Use for**: Streaming → S3/Redshift/OpenSearch.
* **Pros**: Fully managed, auto-scale.
* **Cons**: \~1 min buffering delay.
* **Instead of**: Use Firehose when you need **simple pipelines → storage**.

---

#### **Kinesis Managed Flink**

Real-time **stateful stream processing**.

* **Use for**: Fraud detection, anomaly detection.
* **Pros**: Exactly-once, handles out-of-order data.
* **Cons**: More complex.
* **Instead of**: Use Flink when you need **stateful transformations**.

---

#### **EventBridge**

Event bus for AWS services.

* **Use for**: Trigger ML jobs when events happen (e.g., new file in S3).
* **Pros**: Serverless, native AWS integration.
* **Cons**: Not for high-throughput streams.
* **Instead of**: Use EventBridge when you need **routing, not streaming**.

---

### 🗂 Workflow Orchestration

#### **MWAA (Airflow)**

Managed Apache Airflow.

* **Use for**: Orchestrating multi-step ML pipelines.
* **Pros**: DAG workflows, familiar to data engineers.
* **Cons**: Needs tuning.
* **Instead of**: Use MWAA when you need **complex DAG orchestration** beyond Glue Workflows.

---

## 🤖 Machine Learning & AI on AWS

AWS has two big categories for ML:

1. **Amazon SageMaker** (end-to-end ML platform for data scientists/ML engineers).
2. **Prebuilt AI APIs** (plug-and-play ML for developers without deep ML expertise).

---

### 🧑‍🔬 Amazon SageMaker

The core ML service on AWS. **SageMaker** covers the entire ML lifecycle: build → train → deploy → monitor.

#### 🔑 Key Features

##### **SageMaker Feature Store**

* **Intro**: Centralized store for ML features (offline + online).
* **Use for**: Storing and reusing features consistently across training and inference.
* **Pros**: Low-latency online lookup, versioned features.
* **Cons**: Extra cost and complexity.
* **Instead of**: Use Feature Store over DynamoDB when you need **feature consistency across training + serving**.

---

##### **SageMaker Containers**

* **Intro**: Prebuilt or custom Docker containers for training/inference.
* **Use for**: Running models in managed environments.
* **Pros**: No need to manage infra, supports PyTorch, TensorFlow, SKLearn.
* **Cons**: Limited control vs self-managed EC2.
* **Instead of**: Use SageMaker Containers over ECS/EKS if you want **built-in ML integration**.

---

##### **SageMaker Model Monitor**

* **Intro**: Monitors deployed models for **drift, bias, or data quality issues**.
* **Use for**: Detecting when retraining is needed.
* **Pros**: Automatic metrics, integrates with CloudWatch.
* **Cons**: Extra cost, requires well-defined baselines.
* **Instead of**: Use Model Monitor when you need **ML-specific monitoring**, not just infra metrics.

---

##### **SageMaker Endpoint Auto Scaling**

* **Intro**: Automatically scales model endpoints up/down.
* **Use for**: Handling variable traffic (e.g., daytime vs nighttime).
* **Pros**: Cost-efficient, reliable.
* **Cons**: Cold-start latency possible.
* **Instead of**: Use this instead of EC2 Auto Scaling when serving **ML endpoints**.

---

##### **SageMaker Processing**

* **Intro**: Run preprocessing/postprocessing jobs on managed infra.
* **Use for**: Feature engineering, batch inference.
* **Pros**: Scales compute on demand.
* **Cons**: Overhead compared to Lambda for tiny jobs.
* **Instead of**: Use Processing over EMR for **smaller, ML-specific preprocessing**.

---

##### **SageMaker Data Wrangler**

* **Intro**: Visual data preparation tool integrated with SageMaker.
* **Use for**: Cleaning, transforming, and exporting datasets for training.
* **Pros**: GUI-driven, integrates with S3, Athena, Redshift.
* **Cons**: Not for petabyte-scale ETL (use EMR/Glue instead).
* **Instead of**: Use Wrangler over Glue DataBrew if you’re an **ML engineer** working inside SageMaker.

---

##### **SageMaker DeepAR**

* **Intro**: Built-in deep learning forecasting algorithm.
* **Use for**: Time-series forecasting (sales, demand, traffic).
* **Pros**: Handles seasonality, missing values, multiple time series.
* **Cons**: Black box vs custom models.
* **Instead of**: Use DeepAR over Amazon Forecast when you need **more control and custom ML workflows**.

---

##### **SageMaker JumpStart**

* **Intro**: Hub of prebuilt models and solutions.
* **Use for**: Starting quickly with pretrained models (CV, NLP, tabular).
* **Pros**: Fast prototyping.
* **Cons**: Limited flexibility.
* **Instead of**: Use JumpStart over Bedrock when you need **classical ML/deep learning models**, not LLMs.

---

### ⚡ Prebuilt AI APIs

AWS provides ML-as-a-service for developers who just want to call an API without building models.

---

#### **Amazon Comprehend**

* **What**: NLP service (sentiment, entities, key phrases).
* **Use cases**: Sentiment analysis of reviews, PII detection.
* **Instead of**: Use Comprehend over SageMaker when you need **plug-and-play NLP**.

---

#### **Amazon Rekognition**

* **What**: Image/video analysis.
* **Use cases**: Face detection, object tagging, content moderation.
* **Instead of**: Use Rekognition over SageMaker when you need **ready-made CV APIs**.

---

#### **Amazon Personalize**

* **What**: Real-time recommendation engine.
* **Use cases**: E-commerce recommendations, personalization.
* **Instead of**: Use Personalize when you want **recommendations without building RecSys from scratch**.

---

#### **Amazon Bedrock**

* **What**: Access to **foundation models** (LLMs, diffusion models) via API.
* **Use cases**: Chatbots, GenAI text/image tasks.
* **Instead of**: Use Bedrock over SageMaker when you want **LLMs without managing infra**.

---

#### **Amazon Forecast**

* **What**: Time-series forecasting service (AutoML).
* **Use cases**: Sales, demand planning, resource forecasting.
* **Instead of**: Use Forecast when you want **serverless forecasting without building models**.

---

#### **Amazon Transcribe**

* **What**: Speech-to-text.
* **Use cases**: Call center analytics, captions.
* **Instead of**: Use Transcribe over SageMaker when you need **plug-and-play STT**.

---

#### **Amazon Polly**

* **What**: Text-to-speech.
* **Use cases**: Voice assistants, accessibility apps.
* **Instead of**: Use Polly when you need **ready-made TTS voices**.

---

#### **Amazon Lex**

* **What**: Conversational AI (chatbots).
* **Use cases**: Customer support bots, IVR systems.
* **Instead of**: Use Lex when you want **bot frameworks** instead of coding NLP models yourself.

---

#### **Amazon Mechanical Turk**

* **What**: Human-powered labeling service.
* **Use cases**: Creating training datasets (image labeling, sentiment tags).
* **Instead of**: Use MTurk when automated labeling isn’t enough.

---

#### **Amazon Q**

* **What**: GenAI-powered business assistant.
* **Use cases**: Summarization, Q\&A across enterprise data.
* **Instead of**: Use Q when you need **business-oriented GenAI workflows**.

---


## 🛡️ Security, Monitoring & Governance on AWS

When building ML pipelines, you’re not only responsible for **data science** — you must also handle **security, compliance, and observability**. AWS provides services to control **who can access what, how data is protected, and how activities are monitored**.

---

### 🔑 Core Security & Monitoring Services

#### **IAM (Identity and Access Management)**

* **Intro**: The foundation of AWS security. Controls **who can access what**.
* **Use for**: Authentication (users, roles) and authorization (policies).
* **Use cases**:

  * Assign SageMaker jobs a role to read from S3.
  * Restrict who can start/stop EC2 instances.
* **Pros**: Granular permissions, integrates with all AWS services.
* **Cons**: Can be complex to manage at scale.
* **Instead of**: Always use IAM roles instead of embedding access keys.

---

#### **Amazon Macie**

* **Intro**: ML-powered service to detect **PII (Personally Identifiable Information)** in data stored in S3.
* **Use for**: Data governance and compliance.
* **Use cases**:

  * Scan ML training datasets for sensitive data.
  * Ensure GDPR/CCPA compliance.
* **Pros**: Automated detection of sensitive info.
* **Cons**: Extra cost, only works on S3.
* **Instead of**: Use Macie over Comprehend when you need **security/compliance scans**, not NLP.

---

#### **AWS KMS (Key Management Service)**

* **Intro**: Managed service for encryption keys.
* **Use for**: Encrypting ML datasets, model artifacts, and feature stores.
* **Use cases**:

  * Encrypt feature data in DynamoDB or S3.
  * Secure SageMaker model artifacts.
* **Pros**: Centralized key management, integrates with all AWS services.
* **Cons**: Not for very high-volume encryption (per-request latency).
* **Instead of**: Always use KMS over custom key mgmt for **compliance-grade encryption**.

---

#### **AWS CloudWatch**

* **Intro**: Monitoring + logging service.
* **Use for**: Collecting logs, metrics, and setting alarms.
* **Use cases**:

  * Monitor SageMaker endpoint latency.
  * Trigger alarms when GPU utilization is too high.
* **Pros**: Native integration, supports custom metrics.
* **Cons**: Can get expensive with high log volume.
* **Instead of**: Use CloudWatch over X-Ray for **infrastructure metrics**.

---

#### **AWS CloudTrail**

* **Intro**: Service that records **API calls** made in AWS.
* **Use for**: Auditing and governance (who did what).
* **Use cases**:

  * Track who modified an S3 bucket policy.
  * Prove compliance during audits.
* **Pros**: Complete API history, integrates with CloudWatch.
* **Cons**: Storage cost if logs retained long-term.
* **Instead of**: Use CloudTrail when you need **security/audit history**, not performance monitoring.

---

#### **AWS X-Ray**

* **Intro**: Distributed tracing service.
* **Use for**: Debugging applications, tracing requests end-to-end.
* **Use cases**:

  * Trace inference latency across microservices.
  * Debug Lambda → DynamoDB → SageMaker pipelines.
* **Pros**: Visual trace maps, root cause analysis.
* **Cons**: More dev-focused than ops.
* **Instead of**: Use X-Ray over CloudWatch when you need **request tracing**, not just metrics.

---


Perfect 🙌 — let’s expand the **Compute & Container Services** section in the same blog-style format. This is crucial for the MLS-C01 exam because you’ll often get questions like: *“Which compute option is best for serving ML inferences under constraint X?”*

---

## ⚡ Compute & Container Services on AWS


---

### 🖥️ Amazon EC2 (Elastic Compute Cloud)

* **Intro**: Virtual servers in the cloud.
* **What it’s for**: Full control over compute environments.
* **Use cases**: Custom ML training, hosting self-managed ML frameworks.
* **Pros**: Flexible instance types (CPU/GPU/accelerators), fine-grained control.
* **Cons**: Must manage scaling, patching, networking.
* **Instead of**: Use EC2 when you need **custom environments** not covered by SageMaker.

**Relevant Instance Families for ML:**

* **T3, M5** → general-purpose.
* **C5, C6** → compute-optimized.
* **G4, P3, P4** → GPU-accelerated (deep learning).
* **Inf1, Trn1** → AWS chips for inference/training (Inferentia, Trainium).

---

### 🖥️ Amazon ECS (Elastic Container Service)

* **Intro**: AWS’s own container orchestration platform.
* **What it’s for**: Running Docker containers at scale.
* **Use cases**: Batch inference, microservices for ML APIs.
* **Pros**: Deep AWS integration, simpler than Kubernetes.
* **Cons**: Less portable than Kubernetes (vendor lock-in).
* **Instead of**: Use ECS when you need **simpler container orchestration**.

---

### ☸️ Amazon EKS (Elastic Kubernetes Service)

* **Intro**: Managed Kubernetes.
* **What it’s for**: Portable, flexible container orchestration.
* **Use cases**: Complex ML workloads needing Kubernetes ecosystem.
* **Pros**: Kubernetes compatibility, hybrid cloud.
* **Cons**: More complexity, higher learning curve.
* **Instead of**: Use EKS over ECS when you need **Kubernetes features** (custom schedulers, operators).

---

### 🚀 AWS Fargate

* **Intro**: Serverless compute for containers.
* **What it’s for**: Running ECS/EKS containers without managing EC2 instances.
* **Use cases**: Lightweight ML inference workloads.
* **Pros**: No server management, auto-scaling.
* **Cons**: Less control, can be pricier than EC2 for long-running jobs.
* **Instead of**: Use Fargate when you want **serverless containers** and don’t want to manage infra.

---

### ⚡ AWS Lambda

* **Intro**: Event-driven, serverless compute.
* **What it’s for**: Short-lived tasks, trigger-based ML pipelines.
* **Use cases**:

  * Invoke SageMaker endpoint when new data arrives.
  * Lightweight preprocessing (e.g., image resize before inference).
* **Pros**: Pay-per-invocation, auto-scales instantly.
* **Cons**: Max runtime = 15 minutes, limited memory.
* **Instead of**: Use Lambda for **short, event-driven ML tasks** — not for long training jobs.

#### Lambda Auto Scaling

* Scales automatically with incoming requests.
* Great for unpredictable workloads.
* **Exam tip**: If they ask about *“spiky, unpredictable traffic with low ops overhead”* → answer = **Lambda**.

---


## 📡 IoT & Edge Services on AWS

IoT (Internet of Things) generates massive streaming data from sensors, devices, and edge systems. AWS offers services to **ingest, process, and analyze IoT data**, and extend ML workloads closer to devices.

---

### 🌐 AWS IoT Core

* **Intro**: A managed service that connects **IoT devices** to the AWS cloud securely.
* **What it’s for**: Device connectivity, messaging, and rules-based routing.
* **Use cases**:

  * Collect telemetry from thousands of devices.
  * Trigger ML inference when sensor readings exceed thresholds.
* **Pros**: Secure device authentication (X.509, MQTT), integrates with Kinesis, Lambda, S3.
* **Cons**: Not designed for heavy data processing — just connectivity + routing.
* **Instead of**: Use IoT Core over Kinesis when the source is **IoT devices** that need secure connection.

---

### 📊 AWS IoT Analytics

* **Intro**: A fully managed analytics service for IoT data.
* **What it’s for**: Cleaning, enriching, and analyzing IoT device data at scale.
* **Use cases**:

  * Process sensor data before ML training.
  * Detect anomalies in device behavior.
* **Pros**: Serverless, integrates with ML pipelines (can send data to SageMaker).
* **Cons**: More specialized than Glue/EMR (IoT-specific).
* **Instead of**: Use IoT Analytics over Glue/EMR when you want **prebuilt IoT data pipelines**.

---

### 🧠 Exam Connections for IoT & ML

* **Pipeline example**:
  IoT Core → IoT Analytics → S3 → SageMaker training → deploy model → inference at edge.

* **Edge ML with AWS**:

  * **SageMaker Neo**: Optimize models for edge devices.
  * **Greengrass (not in your list but exam-relevant)**: Deploy Lambda/ML models onto IoT devices.

---


# Data Engineering
## Data Lakes and Storage
### AWS S3
### AWS EFS
### AWS EBS

## Data Warehousing & Query
### AWS Redshift
### Amazon Athena
### AWS DynamoDB
### AWS RDS
### AWS OpenSearch

## Big Data & ETL
### AWS EMR
### AWS Batch
### AWS Glue
#### AWS Glue Workflow
#### AWS Glue Data Brew


## Streaming Data
# AWS Kinesis
## AWS Kinesis Data Sctreams
## AWS Kinesis Data Firehouse
## AWS Managed Service for Apache Flink
# AWS EventBridge


## Workflow Orchestration
# AWS MWAA (Airflow)


# Machine Learning & AI
# AWS SageMaker
## SageMaker Feature Sotre
## SageMaker Containers
## SageMaker Model Monitor
## SageMaker Endpoint Auto Scalling
## SageMaker Processing
## SageMaker Data Wrangler
## SageMaker Deep AR
Used for deep learning based forecasting
## SageMaker JumpStart

## Prebuilt ML Services (AI APIs)
# AWS Comprehend
# AWS Rekognition
# Amazon Personalize
# Amazon Bedrock
# Amazon Forecast
# Amazon Transcribe
# Amazon Polly
# Amazon Lex
# AWS Mechanical Turk
# Amazon Q
Preprocess data  instead spinning up large clusters


# Security, Monitoring, Governance
## IAM role
## Enable Amazon Macie
Enable Amazon macie to detect PII in ML dataset
## AWS KMS
## AWS X-Ray
## AWS CouldWatch
## AWS CloudTrail



# Compute & Container Services
## AWS Fargate
## AWS ECS
## AWS EKS
## AWS Lambda
### Lambda Auto Scalling



# IoT & Edge
## AWS IoT Analytics
## AWS IoT Core




# Concepts

## Handling outliers
### Z-score
### IQR
### Isolation Forest
## Feature Binning (Discretization)
### Fixed Width Binning
### Quantile Binning
### K-means Binning

## Deployment Strategies
### Multi-AZ Deployment
### Multi-Region Deployment
### Blue-Green Deployment
### Canary Deployment

## Synthetic Feature Creation
### Polynomial Features
### Feature Interaction
### Log Trasform

## Gradient Descent Variants
### Batch Gradient Descent
### SGD
### Mini-batch Gradient Descent
### Adam

## Regularization Techniques
### L1
### L2
### Elastic Net


## Corss Validation
### K-Fold CV
### Statified K-Fold
### Leave One Out CV

## Model Initialization
### Random Initialization
### Xavier Initialization
### He Initialization

## Learning Rate
### Fixed Learning Rate
### Decay Learning Rate
### Adaptive Learning Rate

## Regression Metrics
### MAE
### MSE
### RMSE
### R squre score
### Confusion Matrix




# Model Selections
## XGBoost
Key hyperparameters: Number of trees, Tree depth, learning rate
## Logistic Regression
## Linear Regression
## Decision Trees
## Random Forests
## K-Means
## RNN
## CNN
## Ensemble Models
## Transfer Learning
## LLM

# AWS 