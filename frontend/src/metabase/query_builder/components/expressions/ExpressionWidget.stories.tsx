import React from "react";

import type { ComponentStory } from "@storybook/react";
import { useArgs } from "@storybook/client-api";

import styled from "@emotion/styled";
import stateFixture from "__support__/sample_database_fixture.json";
import { getMetadata } from "metabase/selectors/metadata";
import { State } from "metabase-types/store";
import StructuredQuery from "metabase-lib/queries/StructuredQuery";
import ExpressionWidget from "./ExpressionWidget";

const state = stateFixture as unknown as State;
const metadata = getMetadata(state);
const table = metadata.table(1);
const query = new StructuredQuery(table?.question(), {
  type: "query",
  database: table?.db_id,
  query: {
    "source-table": table?.id,
  },
});
export default {
  title: "Query Builder/ExpressionWidget",
  component: ExpressionWidget,
};

const Template: ComponentStory<typeof ExpressionWidget> = args => {
  const [{ name, expression }, updateArgs] = useArgs();

  const handleChange = (name: string, expression: unknown) => {
    updateArgs({ name, expression });
  };

  return (
    <PopoverMock>
      <ExpressionWidget
        {...args}
        query={query}
        name={name}
        expression={expression}
        onChangeExpression={handleChange}
      />
    </PopoverMock>
  );
};

export const Default = Template.bind({});
Default.args = {
  name: undefined,
  expression: undefined,
  reportTimezone: "UTC",
};

const PopoverMock = styled.div`
  background: #ffffff;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
  border-radius: 8px;

  width: 445px;
`;
