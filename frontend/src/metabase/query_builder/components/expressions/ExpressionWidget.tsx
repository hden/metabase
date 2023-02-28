import React, { useRef, useState } from "react";
import cx from "classnames";
import { t } from "ttag";
import styled from "@emotion/styled";
import { isDef } from "metabase/lib/language";
import { color } from "metabase/lib/colors";
import Icon from "metabase/components/Icon";
import Tooltip from "metabase/core/components/Tooltip";
import { isExpression } from "metabase-lib/expressions";
import StructuredQuery from "metabase-lib/queries/StructuredQuery";
import ExpressionEditorTextfield from "./ExpressionEditorTextfield";

type Expression = number | string | Array<any>;

interface ExpressionWidgetProps {
  query: StructuredQuery;
  expression: Expression | undefined;
  name: string | undefined;

  reportTimezone: string;

  onChangeExpression: (name: string, expression: Expression) => void;
  onRemoveExpression?: (name: string) => void;
  onClose?: () => void;
}

const ExpressionWidget = (props: ExpressionWidgetProps): JSX.Element => {
  const {
    query,
    name: initialName,
    expression: initialExpression,
    reportTimezone,
    onChangeExpression,
    onRemoveExpression,
    onClose,
  } = props;

  const [name, setName] = useState(initialName || "");
  const [expression, setExpression] = useState<Expression | null>(
    initialExpression || null,
  );
  const [error, setError] = useState<string | null>(null);

  const helpTextTargetRef = useRef(null);

  const isValid = !!name && !error && isExpression(expression);

  const handleCommit = () => {
    if (isValid && isDef(expression)) {
      onChangeExpression(name, expression);
      onClose && onClose();
    }
  };

  return (
    <Wrapper>
      <div className="p3 pb4">
        <div className="h5 text-uppercase text-light text-bold">
          {t`Expression`}
          <Tooltip
            tooltip={t`You can reference columns here in functions or equations, like: floor([Price] - [Discount]).`}
            placement="right"
            maxWidth={332}
          >
            <IconWrapper>
              <StyledIcon name="info" />
            </IconWrapper>
          </Tooltip>
        </div>
        <div ref={helpTextTargetRef}>
          <ExpressionEditorTextfield
            helpTextTarget={helpTextTargetRef.current}
            expression={expression}
            name={name}
            query={query}
            reportTimezone={reportTimezone}
            onChange={(parsedExpression: Expression) => {
              setExpression(parsedExpression);
              setError(null);
            }}
            onError={(errorMessage: string) => setError(errorMessage)}
          />
        </div>

        <div className="mt3 h5 text-uppercase text-light text-bold">{t`Name`}</div>
        <div>
          <input
            className="mt1 input block full"
            type="text"
            value={name}
            placeholder={t`Something nice and descriptive`}
            onChange={event => setName(event.target.value)}
            onKeyPress={e => {
              if (e.key === "Enter") {
                handleCommit();
              }
            }}
          />
        </div>
      </div>

      <div className="p3 border-top flex flex-row align-center justify-between">
        <div className="ml-auto">
          <button
            className="Button"
            onClick={() => onClose && onClose()}
          >{t`Cancel`}</button>
          <button
            className={cx("Button ml2", {
              "Button--primary": isValid,
            })}
            onClick={handleCommit}
            disabled={!isValid}
          >
            {initialName ? t`Update` : t`Done`}
          </button>
        </div>
        <div>
          {initialName && onRemoveExpression ? (
            <a
              className="pr2 ml2 text-error link"
              onClick={() => {
                onRemoveExpression(initialName);
                onClose && onClose();
              }}
            >{t`Remove`}</a>
          ) : null}
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 445px;
`;

const IconWrapper = styled.span`
  margin-left: 4px;
  cursor: help;

  &:hover {
    color: ${color("text-dark")};
  }
`;

const StyledIcon = styled(Icon)`
  width: 10px;
  height: 10px;
`;

export default ExpressionWidget;
