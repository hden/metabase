(ns metabase.lib.metadata-test
  (:require
   [clojure.test :as t]
   [metabase.lib.core :as lib]
   [metabase.lib.metadata :as lib.metadata]
   [metabase.lib.test-metadata :as meta])
  #?(:cljs (:require [metabase.test-runner.assert-exprs.approximately-equal])))

(t/deftest ^:parallel field-metadata-test
  (t/is (=? (merge
             {:lib/type :metadata/field}
             (meta/field-metadata :venues :category-id))
            (lib.metadata/field-metadata meta/metadata "VENUES" "CATEGORY_ID"))))

(t/deftest ^:parallel field-metadata-from-query-test
  (let [query (lib/query meta/metadata "CATEGORIES")]
    (t/are [x] (=? (merge
                    {:lib/type :metadata/field}
                    (meta/field-metadata :venues :category-id))
                   (lib.metadata/field-metadata x "VENUES" "CATEGORY_ID"))
      query
      (lib/metadata query)))
  (t/testing "Field from a *different* Table"
    (let [query (lib/query meta/metadata "CATEGORIES")]
      (t/is (=? {:lib/type :metadata/field
                 :id       (meta/id :venues :id)}
                (lib.metadata/field-metadata query "VENUES" "ID"))))))

(t/deftest ^:parallel field-metadata-from-results-metadata-test
  (let [query (lib/saved-question-query meta/metadata meta/saved-question)]
    (t/are [x] (=? {:lib/type       :metadata/field
                    :display_name   "CATEGORY_ID"
                    :field_ref      [:field "CATEGORY_ID" {:base-type :type/Integer}]
                    :name           "CATEGORY_ID"
                    :base_type      :type/Integer
                    :effective_type :type/Integer
                    :semantic_type  nil}
                   (lib.metadata/field-metadata x "CATEGORY_ID"))
      query
      (get-in query [:stages 0 :lib/stage-metadata]))))

(t/deftest ^:parallel field-metadata-for-field-clause-test
  (let [metadata {:lib/type :metadata/stage, :columns (:fields (meta/table-metadata :users))}]
    (t/is (=? {:lib/type :metadata/field
               :name     "ID"}
              (lib.metadata/field-metadata metadata nil [:field (meta/id :users :id) nil])))))
