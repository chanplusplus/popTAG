/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.tweetapp;

import com.github.nkzawa.emitter.Emitter;
import org.apache.log4j.Logger;
import org.apache.log4j.Level;

import org.apache.spark.*;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.function.*;
import org.apache.spark.streaming.*;
import org.apache.spark.streaming.api.java.*;
import org.apache.spark.streaming.twitter.TwitterUtils;

import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.Serializable;
import java.util.*;
import java.net.URISyntaxException;

import scala.Tuple2;
import twitter4j.Status;

import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import org.json.JSONException;


/**
 * Created by Chan Pruksapha on 3/2/2016 AD.
 */
public class Main {

    static Socket getSocket(){
        Socket tmp_socket;
        try {
            tmp_socket = IO.socket("http://localhost:3000");

        } catch (URISyntaxException e) {
            tmp_socket = null;
        }
        return tmp_socket;
    }

    static class MyListener implements Emitter.Listener {
        Object lock;
        String msg;
        MyListener(Object lock, String msg){
            this.lock = lock;
            this.msg = msg;
        }
        public void call(Object... objects) {
            synchronized (lock) {
                System.out.println(msg);
                lock.notifyAll();
            }
        }
    }


    static void startSparkStream(final JavaStreamingContext jssc, final Socket socket) {

        final Integer topNTags = 10;
        Duration outputSlide = new Duration(5000);
        Duration outputWindow = new Duration(60000);

        // Configuring Twitter credentials
        String apiKey = "On4lmf0wFOQ72qpZLMdJHYOXQ";
        String apiSecret = "tskmQAEwFJSEDGntnkRGgjOxX8nVr8JyTbwtiliJ0G3eumuyFR";
        String accessToken = "35429495-V3UmzdTxQX3Wqh8Zfh8BsjlGGcxdeWSELTCh4VLBe";
        String accessTokenSecret = "vgKiJPoPVui2baXZCAW878IothSD5qYMO6K3INfbMXD7q";
        System.setProperty("twitter4j.oauth.consumerKey", apiKey);
        System.setProperty("twitter4j.oauth.consumerSecret", apiSecret);
        System.setProperty("twitter4j.oauth.accessToken", accessToken);
        System.setProperty("twitter4j.oauth.accessTokenSecret", accessTokenSecret);

        JavaReceiverInputDStream<Status> tweets = TwitterUtils.createStream(jssc);
        tweets.persist();

        JavaDStream<String> words = tweets.flatMap(new FlatMapFunction<Status, String>() {
            @Override
            public Iterable<String> call(Status s) throws Exception {
                return Arrays.asList(s.getText().split("\\s+"));
            }
        });

        JavaDStream<String> hashTags = words.filter(new Function<String, Boolean>()  {
            @Override
            public Boolean call(String word) throws Exception {
                return word.startsWith("#");
            }
        });

        JavaPairDStream<String, Integer> hashTagCount = hashTags.mapToPair(
                new PairFunction<String, String, Integer>() {
                    @Override
                    public Tuple2<String, Integer> call(String s) throws Exception {
                        // leave out the # character
                        return new Tuple2<String, Integer>(s, 1);
                    }
                });

        Function2<Integer, Integer, Integer> addition = new Function2<Integer, Integer, Integer>()  {
            @Override
            public Integer call(Integer a, Integer b) throws Exception {
                return a + b;
            }
        };

        JavaPairDStream<String, Integer> hashTagTotals = hashTagCount
                .reduceByKeyAndWindow(addition, outputWindow, outputSlide);



        /*****   Get top N tags   *****/

        class MyComparable implements Comparator<Tuple2<String, Integer>>, Serializable {
            public int compare(Tuple2<String, Integer> o1, Tuple2<String, Integer> o2) {
                return o2._2() - o1._2();
            }
        };

        hashTagTotals.foreachRDD(new VoidFunction<JavaPairRDD<String, Integer>>() {
            @Override
            public void call(JavaPairRDD<String, Integer> htTotal) throws Exception {

                List<Tuple2<String, Integer>> topList = htTotal.takeOrdered(topNTags, new MyComparable());

                // List of (tag, cnt)
                JSONArray jsonArr = new JSONArray();

                for(Tuple2<String, Integer> e: topList) {
                    // Single (tag, cnt)
                    JSONObject tagcnt = new JSONObject();
                    jsonArr.put(tagcnt.put("tag", e._1()).put("count", e._2()));
                }
                socket.emit("topTags",jsonArr);
            }
        });



        /*
           Get Popular hashtags in each country.
           Perform only on the most four popular langauges
         */

        JavaPairDStream<String,String> langWordPairs = tweets.flatMapToPair(
                new PairFlatMapFunction<Status, String, String>() {
                    @Override
                    public Iterable<Tuple2<String, String>> call(Status s) throws Exception {
                        String[] words = s.getText().split("\\s+");
                        ArrayList<Tuple2<String, String>> pairs = new ArrayList<Tuple2<String, String>>(words.length);
                        for (int i = 0; i != words.length; ++i) {
                            pairs.add(new Tuple2<String, String>(s.getLang(), words[i]));
                        }
                        return pairs;
                    }
                }
        );

        JavaPairDStream<String,String> langAndHashTags = langWordPairs.filter(
                new Function<Tuple2<String, String>, Boolean>() {
                    @Override
                    public Boolean call(Tuple2<String,String> lt) throws Exception {
                        return lt._2().startsWith("#");
                    }
                });


        JavaPairDStream<Tuple2<String,String>, Integer> langAndTagCounts = langAndHashTags.mapToPair(
                new PairFunction<Tuple2<String, String>, Tuple2<String,String>, Integer>(){
                    @Override
                    public Tuple2<Tuple2<String,String>, Integer> call(Tuple2<String, String> lt) throws Exception {
                        return new Tuple2<Tuple2<String,String>, Integer>(lt, 1);
                    }
                }
        );

        JavaPairDStream<Tuple2<String,String>, Integer> langAndTagTotals = langAndTagCounts
                .reduceByKeyAndWindow(addition,outputWindow, outputSlide);

        class TagTotalPair extends Tuple2<String, Integer> implements Comparable<TagTotalPair>, Serializable {
            public String getTag(){
                return this._1();
            }
            public Integer getTotal(){
                return this._2();
            }
            TagTotalPair(String tag, Integer total) {
                super(tag, total);
            }
            public int compareTo(TagTotalPair o) {
                return this.getTotal() - o.getTotal();
            }
        };

        JavaPairDStream<String, TagTotalPair> langAndTagTotals2 = langAndTagTotals.mapToPair(new PairFunction<Tuple2<Tuple2<String,String>, Integer>, String, TagTotalPair>(){
                    @Override
                    public Tuple2<String, TagTotalPair> call(Tuple2<Tuple2<String,String>, Integer> langTagTots) throws Exception {
                        Tuple2<String,String> langTag = langTagTots._1();
                        String lang = langTag._1();
                        String tag = langTag._2();
                        Integer total = langTagTots._2();
                        return new Tuple2<String, TagTotalPair>(lang, new TagTotalPair(tag, total));
                    }
                }
        );

        /*
            This part perform "Build priority queues, containing top-K hash tags, indexed by language"
         */

        class MinQStringPair extends PriorityQueue<TagTotalPair> {
            int maxSize;
            MinQStringPair(int maxSize) {
                super(maxSize);
                this.maxSize = maxSize;
            }
            public boolean add(TagTotalPair newPair) {
                if(size() < maxSize )  {
                    super.add(newPair);
                    return true;
                }
                else if(newPair.compareTo(super.peek()) > 0) {
                    super.poll();
                    super.add(newPair);
                    return true;
                }
                return false;
            }
        };


        Function<TagTotalPair, MinQStringPair> createCombiner = new Function<TagTotalPair, MinQStringPair>() {
            public MinQStringPair call(TagTotalPair langCnt) throws Exception{
                MinQStringPair minQ = new MinQStringPair(topNTags);
                minQ.add(langCnt);
                return minQ;
            }
        };
        Function2<MinQStringPair, TagTotalPair, MinQStringPair> mergeValue =
                new Function2<MinQStringPair, TagTotalPair, MinQStringPair>() {
                    public MinQStringPair call(MinQStringPair minQ, TagTotalPair langCnt) throws Exception {
                        minQ.add(langCnt);
                        return minQ;
                    }
                };
        Function2<MinQStringPair, MinQStringPair, MinQStringPair> mergeCombiners =
                new Function2<MinQStringPair, MinQStringPair, MinQStringPair>() {
                    public MinQStringPair call(MinQStringPair qa, MinQStringPair qb) throws Exception {
                        MinQStringPair qc, qd;
                        if(qa.size() > qb.size()) { qc = qa; qd = qb; }
                        else { qc = qb; qd = qa; }
                        while(qd.size() != 0)
                            qc.add(qd.poll());
                        return qc;
                    }
                };

        JavaPairDStream<String, MinQStringPair> langAndTogNTags =
                langAndTagTotals2.combineByKey(createCombiner, mergeValue, mergeCombiners, new HashPartitioner(4), true);

        langAndTogNTags.foreachRDD(new VoidFunction<JavaPairRDD<String, MinQStringPair>>() {
            @Override
            public void call(JavaPairRDD<String, MinQStringPair> langAndMinQ) {
                try {
                    List<Tuple2<String, MinQStringPair>> topList = langAndMinQ.collect();

                    JSONArray jsonArr1 = new JSONArray();

                    for (Tuple2<String, MinQStringPair> pair : topList) {

                        JSONObject jsonObj = new JSONObject();

                        System.out.println(String.format("%s :", pair._1()));

                        jsonObj.put("lang", pair._1());

                        ArrayList<TagTotalPair> langCntList = new ArrayList<TagTotalPair>(pair._2());
                        Collections.sort(langCntList);
                        Collections.reverse(langCntList);
                        JSONArray jsonArr2 = new JSONArray();
                        for (TagTotalPair e : langCntList) {
                            System.out.print(String.format(" (%s,%d)", e.getTag(), e.getTotal()));
                            jsonArr2.put(new JSONObject().put("tag", e.getTag()).put("count", e.getTotal()));
                        }

                        System.out.println();
                        jsonObj.put("topTags", jsonArr2);
                        jsonArr1.put(jsonObj);
                    }

                    socket.emit("topTagByLangs", jsonArr1);
                } catch (JSONException ex) {
                    java.util.logging.Logger.getLogger(Main.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
                }
            }
        });

        jssc.start();
        jssc.awaitTermination();

    }

    static void suiside(){
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        String jvmName = runtimeBean.getName();
        System.out.println("JVM Name = " + jvmName);
        long pid = Long.valueOf(jvmName.split("@")[0]);
        Runtime rt = Runtime.getRuntime();
        try {
            rt.exec(String.format("kill -9 %d",pid));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }


    public static void main(String[] args) throws URISyntaxException {

        Logger.getLogger("org").setLevel(Level.OFF);
        SparkConf sparkConf = new SparkConf().setAppName("PopularTag6.0");

        final JavaStreamingContext jssc =  new JavaStreamingContext(sparkConf, new Duration(5000));
        Socket socket = getSocket();

        if(socket != null) {
            Object lock = new Object();

            socket.connect();
            socket.on("shutdown", new MyListener(lock,"ME: Getting shutdown message!"));
            System.out.println("ME: Open twitter Stream.");
            startSparkStream(jssc, socket);

            synchronized (lock) {
                try {
                    System.out.println("ME: Enter Wait.");
                    lock.wait();
                    System.out.println("ME: Exit Wait.");
                    suiside();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }

        } else {
            System.err.println("ME: Can't reach Node.js Server!!!");
            System.exit(0);
        }

    }









}
