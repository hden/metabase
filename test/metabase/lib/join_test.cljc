(ns metabase.lib.join-test
  (:require
   [clojure.test :as t]
   [metabase.lib.core :as lib]
   [metabase.lib.metadata :as lib.metadata]
   [metabase.lib.test-metadata :as meta])
  #?(:cljs (:require [metabase.test-runner.assert-exprs.approximately-equal])))

(t/deftest ^:parallel join-test
  (t/is (=? {:lib/type :mbql/query
             :database (meta/id)
             :type     :pipeline
             :stages   [{:lib/type     :mbql.stage/mbql
                         :lib/options  {:lib/uuid string?}
                         :source-table (meta/id :venues)
                         :joins        [{:lib/type    :mbql/join
                                         :lib/options {:lib/uuid string?}
                                         :stages      [{:lib/type     :mbql.stage/mbql
                                                        :lib/options  {:lib/uuid string?}
                                                        :source-table (meta/id :categories)}]
                                         :condition   [:=
                                                       {:lib/uuid string?}
                                                       [:field (meta/id :venues :category-id) {:lib/uuid string?}]
                                                       [:field (meta/id :categories :id) {:lib/uuid string?}]]}]}]}
            (-> (lib/query meta/metadata "VENUES")
                (lib/join (lib/query meta/metadata "CATEGORIES")
                          (lib/= (lib/field "VENUES" "CATEGORY_ID")
                                 (lib/field "CATEGORIES" "ID")))
                (dissoc :lib/metadata)))))

(t/deftest ^:parallel join-saved-question-test
  (t/is (=? {:lib/type :mbql/query
             :database (meta/id)
             :type     :pipeline
             :stages   [{:lib/type     :mbql.stage/mbql
                         :lib/options  {:lib/uuid string?}
                         :source-table (meta/id :categories)
                         :joins        [{:lib/type    :mbql/join
                                         :lib/options {:lib/uuid string?}
                                         :stages      [{:lib/type     :mbql.stage/mbql
                                                        :lib/options  {:lib/uuid string?}
                                                        :source-table #"^card__\d+$"}]
                                         :condition   [:=
                                                       {:lib/uuid string?}
                                                       [:field (meta/id :venues :category-id) {:lib/uuid string?}]
                                                       [:field (meta/id :categories :id) {:lib/uuid string?}]]}]}]}
            (-> (lib/query meta/metadata "CATEGORIES")
                (lib/join (lib/saved-question-query meta/metadata meta/saved-question)
                          (lib/= (lib/field "VENUES" "CATEGORY_ID")
                                 (lib/field "CATEGORIES" "ID")))
                (dissoc :lib/metadata)))))

(t/deftest ^:parallel join-condition-field-metadata-test
  (t/testing "Should be able to use raw Field metadatas in the join condition"
    (let [q1                          (lib/query meta/metadata "CATEGORIES")
          q2                          (lib/saved-question-query meta/metadata meta/saved-question)
          venues-category-id-metadata (lib.metadata/field-metadata q1 "VENUES" "CATEGORY_ID")
          categories-id-metadata      (lib.metadata/field-metadata q2 "ID")]
      (t/testing "lib/join-clause: return a function that can be resolved later"
        (let [f (lib/join-clause q2 (lib/= venues-category-id-metadata categories-id-metadata))]
          (t/is (fn? f))
          (t/is (=? {:lib/type    :mbql/join
                     :lib/options {:lib/uuid string?}
                     :stages      [{:lib/type     :mbql.stage/mbql
                                    :lib/options  {:lib/uuid string?}
                                    :source-table #"^card__\d+$"}]
                     :condition   [:=
                                   {:lib/uuid string?}
                                   [:field (meta/id :venues :category-id) {:lib/uuid string?}]
                                   [:field "ID" {:base-type :type/BigInteger, :lib/uuid string?}]]}
                    (f {:lib/metadata meta/metadata} -1)))))
      (t/is (=? {:database (meta/id)
                 :stages   [{:source-table (meta/id :categories)
                             :joins        [{:lib/type    :mbql/join
                                             :lib/options {:lib/uuid string?}
                                             :stages      [{:source-table #"^card__\d+$"}]
                                             :condition   [:=
                                                           {:lib/uuid string?}
                                                           [:field (meta/id :venues :category-id) {:lib/uuid string?}]
                                                           [:field "ID" {:base-type :type/BigInteger, :lib/uuid string?}]]}]}]}
                (-> q1
                    (lib/join q2 (lib/= venues-category-id-metadata categories-id-metadata))
                    (dissoc :lib/metadata)))))))
