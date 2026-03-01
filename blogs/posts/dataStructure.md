# Data Stucture Basic Concepts <!-- omit in toc -->

*Published on 2025-04-14 in [AI](../topics/ai.html)*

- [Array](#array)
- [Linked List](#linked-list)
    - [Impletementation](#impletementation)
- [Doubly Linked List](#doubly-linked-list)
- [Stack](#stack)
- [Queue](#queue)
- [Tree](#tree)
  - [Binary Tree](#binary-tree)
  - [Binary Search Tree](#binary-search-tree)
  - [AVL Tree](#avl-tree)
  - [Red-Black Tree](#red-black-tree)
  - [B Tree](#b-tree)
  - [Graph](#graph)


# Array

# Linked List

### Impletementation

```python

class Node:
    def __init__(self, data: int):
        self.data = data
        self.next: Node | None = None


class LinkedList:
    def __init__(self):
        self.head: Node | None = None

    def append(self, data: int):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node

    def insert_at_beginning(self, data: int):
        new_node = Node(data)
        new_node.next = self.head
        self.head = new_node

    def insert_at_position(self, position: int, data: int):
        if position < 0:
            raise IndexError("Position cannot be negative")

        new_node = Node(data)

        if position == 0:
            self.insert_at_beginning(data)
            return

        current = self.head
        index = 0

        while current and index < position - 1:
            current = current.next
            index += 1

        if not current:
            raise IndexError("Position out of bounds")

        new_node.next = current.next
        current.next = new_node

    def delete(self, key: int):
        current = self.head

        if current and current.data == key:
            self.head = current.next
            return

        prev = None
        while current and current.data != key:
            prev = current
            current = current.next

        if current:
            prev.next = current.next

    def reverse(self):
        prev = None
        current = self.head

        while current:
            next_node = current.next
            current.next = prev
            prev = current
            current = next_node

        self.head = prev

    def reverse_recursive(self):
        def _reverse_recursive(current: Node | None, prev: Node | None):
            if not current:
                return prev
            next_node = current.next
            current.next = prev
            return _reverse_recursive(next_node, current)

        self.head = _reverse_recursive(self.head, None)

    def display(self):
        elements = []
        current = self.head
        while current:
            elements.append(current.data)
            current = current.next
        print("Linked List:", elements)


ll = LinkedList()
ll.append(1)
ll.append(2)
ll.append(3)
ll.append(4)

ll.display()  # Linked List: [1, 2, 3, 4]

ll.reverse_recursive()
ll.display()  # Linked List: [4, 3, 2, 1]

```


# Doubly Linked List

# Stack

# Queue

# Tree

## Binary Tree

## Binary Search Tree

## AVL Tree


## Red-Black Tree


## B Tree

## Graph
