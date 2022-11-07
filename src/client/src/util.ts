import url from "url";
import { LabelId } from "./model/useNotes";

type Query = {
  q: string[];
  labels: LabelId[];
};

export function getQuery(): Query {
  let { q, labels } = url.parse(document.URL, true).query;
  const labelList = Array.isArray(labels) ? labels : labels ? [labels] : [];
  return {
    q: [],
    labels: labelList,
  };
}
