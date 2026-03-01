# Book Logs: Machine Learning Interviews


*Published on 2025-03-12 in [AI](../topics/ai.html)*
- [Book Logs: Machine Learning Interviews](#golang-notes)
  - [Summarizing Regularization](#SummarizingRegularization)





# Summarizing Regularization

Regularization is a technique used to reduce overfitting of ML models. Generally,
regularization will create a damper on model weights/coefficient. By this point, you
likely know what I’m going to do—which is to bring up the apples again! Apples are
my favorite fruit, which is probably why I use the example so often. So let’s say the
model has learned to weigh “weight of apple” more heavily (accidental pun, but
model “weights” is legitimate terminology); then the weight of the apple is mathe
matically increasing the results of the ML model’s prediction of the price by a rela
tively high positive value. If you can dampen the amount by which the weight of the
apple increases the model’s predictions of the price, via regularization, that can make
the model generalize more and take other variables into account more evenly.