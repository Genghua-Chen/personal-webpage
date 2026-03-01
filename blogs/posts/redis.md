# Redis


*Published on 2025-01-26 in [Programming](../topics/programming.html)*
- [Redis](#redis)
	- [String](#string)
	- [List](#list)
	- [Set](#set)
	- [Sorted Set (Zset)](#sorted-set-zset)
	- [Hash](#hash)
	- [Bitmap](#bitmap)
	- [HyperLogLog](#hyperloglog)
	- [Stream](#stream)
	- [Note on Geospatial Indexing](#note-on-geospatial-indexing)


Redis is a powerful in-memory data store that supports various data types. Each type is designed for different use cases—from caching simple strings to managing complex messaging logs. In this log, I’ll walk through all the main Redis data types, provide practical examples of their values, and conclude with a handy summary table.

## String

The simplest Redis data type, a string is a binary-safe sequence of bytes. It can store text, numbers, or even serialized objects.

**Example Value:**  
```redis
SET greeting "Hello, Redis!"
```

---

## List

A list in Redis is an ordered collection of strings. Think of it like a linked list where you can push or pop elements from both ends.

**Example Value:**  
```redis
RPUSH tasks "task1" "task2" "task3"
```

---

## Set

A set is an unordered collection of unique strings. It automatically ensures that no duplicate elements are stored.

**Example Value:**  
```redis
SADD fruits "apple" "banana" "cherry"
```

---

## Sorted Set (Zset)

Similar to a set, a sorted set stores unique strings; however, each element is associated with a floating-point score that determines the order.

**Example Value:**  
```redis
ZADD leaderboard 1500 "Alice" 1200 "Bob"
```

---

## Hash

A hash is a collection of field-value pairs, very similar to a dictionary or a map. It is ideal for representing objects.

**Example Value:**  
```redis
HMSET user:1001 name "John Doe" age "30" email "john@example.com"
```

---

## Bitmap

Although implemented as a string under the hood, a bitmap allows you to work with individual bits. This makes it very memory efficient for certain types of data.

**Example Value:**  
Imagine a binary string like:  
`10100101`  
*(Each bit could represent a flag such as “has_logged_in_today”.)*

---

## HyperLogLog

HyperLogLog is a probabilistic data structure that provides an approximation of the cardinality (i.e., the count of unique elements) of a set. It’s extremely memory efficient for large datasets.

**Example Value:**  
You might use the following command to add elements:  
```redis
PFADD unique_users "user1" "user2" "user3"
```

---

## Stream

Introduced in Redis 5.0, streams are an append-only log data structure. They are ideal for capturing sequences of events and can function similarly to message queues.

**Example Value:**  
A typical stream entry might look like:  
```redis
XADD mystream * event "user_signup" user "123"
```

---

## Note on Geospatial Indexing

While not a separate data type, Redis provides geospatial capabilities using a special set of commands on sorted sets. With commands like `GEOADD` and `GEORADIUS`, you can store and query geographic locations (latitude and longitude).

**Example Value:**  
```redis
GEOADD locations 13.361389 38.115556 "Palermo"
```


| **Data Type**    | **Description**                                                                              | **Example Usage**                      | **Example Value**                                                  |
|------------------|----------------------------------------------------------------------------------------------|----------------------------------------|--------------------------------------------------------------------|
| **String**       | Simple key-value pair storing text, numbers, or binary data.                                  | Caching, session storage               | `"Hello, Redis!"`                                                  |
| **List**         | Ordered collection of strings.                                                               | Task queues, event logs                | `["task1", "task2", "task3"]`                                        |
| **Set**          | Unordered collection of unique strings.                                                      | Unique tags, unique user IDs           | `{"apple", "banana", "cherry"}`                                      |
| **Sorted Set**   | Set of unique strings, each with an associated score for sorting.                            | Leaderboards, priority queues          | `{("Alice", 1500), ("Bob", 1200)}`                                   |
| **Hash**         | A map between fields and values, ideal for representing objects.                             | User profiles, configuration settings  | `{"name": "John Doe", "age": "30", "email": "john@example.com"}`     |
| **Bitmap**       | Bit-level representation (using strings) for efficiently storing binary data.                | Tracking daily active users, binary flags | `"10100101"` (as a conceptual binary string)                      |
| **HyperLogLog**  | Probabilistic structure for approximating the count of unique elements.                       | Counting unique visitors               | Conceptually used via commands like `PFADD` (e.g., unique users)     |
| **Stream**       | Append-only log for capturing a sequence of events, similar to a message queue.                | Real-time messaging, event logging     | A stream entry: `id: "1577888248123-0", fields: {"event": "click"}`   |
| **Geospatial**   | (Implemented on sorted sets) Enables storage and querying of geolocation data (latitude/longitude). | Finding nearby places, location-based searches | Example: `GEOADD locations 13.361389 38.115556 "Palermo"`        |


