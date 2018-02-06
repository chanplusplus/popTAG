# TwitterPopularTags

## Global Popularity


### Counting Hashtags

This part of my code is almost identical to an official spark streaming [example](https://github.com/apache/spark/blob/ea59b0f3a6600f8046e5f3f55e89257614fb1f10/examples/src/main/java/org/apache/spark/examples/streaming/JavaTwitterHashTagJoinSentiments.java#L73-L114).

#### words

```
JavaDStream<String> words = stream.flatMap(new FlatMapFunction<Status, String>() {
  @Override
  public Iterable<String> call(Status s) {
    return Arrays.asList(s.getText().split(" "));
  }
});
```

#### hashtags

```
JavaDStream<String> hashTags = words.filter(new Function<String, Boolean>()  {
    @Override
    public Boolean call(String word) throws Exception {
        return word.startsWith("#");
    }
});
```

#### hashtagCount

```
JavaPairDStream<String, Integer> hashTagCount = hashTags.mapToPair(
        new PairFunction<String, String, Integer>() {
            @Override
            public Tuple2<String, Integer> call(String s) throws Exception {
                // leave out the # character
                return new Tuple2<String, Integer>(s, 1);
            }
        });
```

#### hashtagTotals

```
Function2<Integer, Integer, Integer> addition = new Function2<Integer, Integer, Integer>()  {
    @Override
    public Integer call(Integer a, Integer b) throws Exception {
        return a + b;
    }
};


JavaPairDStream<String, Integer> hashTagTotals = hashTagCount
        .reduceByKeyAndWindow(addition, outputWindow, outputSlide);
```

##
