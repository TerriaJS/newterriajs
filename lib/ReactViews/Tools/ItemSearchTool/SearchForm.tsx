import isEmpty from "lodash-es/isEmpty";
import React, { useEffect, useState } from "react";
import {
  useTranslation,
  WithTranslation,
  withTranslation,
  TFunction
} from "react-i18next";
import ReactSelect, {
  ActionMeta,
  OptionTypeBase,
  ValueType
} from "react-select";
import styled from "styled-components";
import ItemSearchProvider, {
  EnumItemSearchParameter,
  ItemSearchParameter,
  ItemSearchParameterType,
  ItemSearchResult,
  NumericItemSearchParameter,
  TextItemSearchParameter
} from "../../../Models/ItemSearchProviders/ItemSearchProvider";
import ErrorComponent from "./ErrorComponent";
import { ItemSearchQuery } from "./ItemSearchTool";
import Loading from "./Loading";
import Text from "../../../Styled/Text";
import Box from "../../../Styled/Box";
import Button from "../../../Styled/Button";

export interface SearchFormProps extends WithTranslation {
  itemSearchProvider: ItemSearchProvider;
  parameters: ItemSearchParameter[];
  query: ItemSearchQuery;
  onResults: (query: ItemSearchQuery, results: ItemSearchResult[]) => void;
  onValueChange?: (parameterId: string, value: any) => void;
  afterLoad?: () => void;
}

type State =
  | { is: "initial" }
  | { is: "searching" }
  | { is: "error"; error: Error }
  | { is: "results"; results: ItemSearchResult[] };

const SearchForm: React.FC<SearchFormProps> = (props) => {
  const { parameters, itemSearchProvider } = props;
  const [t] = useTranslation();
  const [state, setState] = useState<State>({ is: "initial" });
  const [query, setQuery] = useState<ItemSearchQuery>(props.query);

  useEffect(
    function setValuesFromProps() {
      setQuery(props.query);
    },
    [props.query]
  );

  const setParameterValue =
    (id: string, type: ItemSearchParameterType) => (value: any) => {
      const newQuery: ItemSearchQuery = {
        ...query,
        [id]: { type, value }
      };
      // Delete the value so that we don't trigger search for it
      if (newQuery[id].value === undefined) delete newQuery[id];
      setQuery(newQuery);
      if (value !== undefined) props.onValueChange?.(id, value);
    };

  function search() {
    const parameterValues: Map<string, any> = new Map(
      Object.entries(query).map(([id, { value }]) => [id, value])
    );
    setState({ is: "searching" });
    itemSearchProvider
      .search(parameterValues)
      .then((results) => {
        setState({ is: "results", results });
        props.onResults(query, results);
      })
      .catch((error) => {
        console.warn(error);
        setState({ is: "error", error });
      });
  }

  const onSubmit = (e: React.FormEvent) => {
    try {
      search();
    } finally {
      e.preventDefault();
    }
  };

  const clearForm = () => setQuery({});

  const disabled = state.is === "searching";

  return (
    <Form onSubmit={onSubmit}>
      <Box centered>
        {state.is === "searching" && (
          <Loading>{t("itemSearchTool.searching")}</Loading>
        )}
        {state.is === "error" && (
          <ErrorComponent>{t("itemSearchTool.searchError")}</ErrorComponent>
        )}
      </Box>
      <FieldSet disabled={disabled}>
        {parameters.map((p) => (
          <Field key={p.id}>
            <Parameter
              parameter={p}
              onChange={setParameterValue(p.id, p.type)}
              value={query[p.id]?.value}
              disabled={disabled}
              t={t}
            />
          </Field>
        ))}
        <SearchButton primary type="submit" disabled={disabled}>
          {t("itemSearchTool.searchBtnText")}
        </SearchButton>
        <Button secondary type="reset" onClick={clearForm} disabled={disabled}>
          {t("itemSearchTool.resetBtnText")}
        </Button>
      </FieldSet>
    </Form>
  );
};

interface ParameterProps {
  parameter: ItemSearchParameter;
  onChange: (value: any) => void;
  value?: any;
  disabled: boolean;
  t: TFunction;
}

const Parameter: React.FC<ParameterProps> = (props) => {
  const { parameter } = props;
  switch (parameter.type) {
    case "numeric":
      return <NumericParameter {...props} parameter={parameter} />;
    case "enum":
      return <EnumParameter {...props} parameter={parameter} />;
    case "text":
      return <TextParameter {...props} parameter={parameter} />;
  }
};

interface NumericParameterProps {
  parameter: NumericItemSearchParameter;
  onChange: (value: { start?: number; end?: number } | undefined) => void;
  value?: { start: number; end: number };
  t: TFunction;
}

export const NumericParameter: React.FC<NumericParameterProps> = (props) => {
  const { parameter, value, t } = props;
  const { min, max } = parameter.range;

  const onChange =
    (tag: "start" | "end") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      const newValue: any = { ...props.value };
      if (isNaN(parsed)) delete newValue[tag];
      else newValue[tag] = parsed;
      props.onChange(isEmpty(newValue) ? undefined : newValue);
    };

  return (
    <Box column>
      <ParameterName>{parameter.name}</ParameterName>
      <Box
        css={`
          justify-content: space-between;
        `}
      >
        <HalfWidthLabel>
          <Box column>
            <Text small>{t("itemSearchTool.numericParameter.minimum")}</Text>
            <Input
              type="number"
              name={`${parameter.id}-min`}
              value={value?.start ?? ""}
              min={min}
              max={max}
              step="any"
              placeholder={min.toString()}
              onChange={onChange("start")}
            />
          </Box>
        </HalfWidthLabel>
        <HalfWidthLabel>
          <Box column>
            <Text small>{t("itemSearchTool.numericParameter.maximum")}</Text>
            <Input
              type="number"
              name={`${parameter.id}-max`}
              value={value?.end ?? ""}
              min={min}
              max={max}
              step="any"
              placeholder={max.toString()}
              onChange={onChange("end")}
            />
          </Box>
        </HalfWidthLabel>
      </Box>
    </Box>
  );
};

interface EnumParameterProps {
  parameter: EnumItemSearchParameter;
  value?: string[];
  onChange: (value: string[] | undefined) => void;
  disabled: boolean;
}

type SelectOnChangeHandler<
  OptionType extends OptionTypeBase,
  IsMulti extends boolean
> = (
  value: ValueType<OptionType, IsMulti>,
  actionMeta: ActionMeta<OptionType>
) => void;

const EnumParameter: React.FC<EnumParameterProps> = (props) => {
  const { parameter, disabled } = props;
  const options = parameter.values.map(({ id }) => ({
    value: id,
    label: id || "<empty>"
  }));
  const value = options.filter((o) => props.value?.includes(o.value));
  const onChange: SelectOnChangeHandler<
    {
      value: string;
      label: string;
    },
    true
  > = (selectedOptions) => {
    const values = selectedOptions?.map(({ value }) => value);
    props.onChange(values?.length === 0 ? undefined : values);
  };
  return (
    <Box column>
      <Label>
        <ParameterName>{parameter.name}</ParameterName>
        <Select
          name={parameter.id}
          options={options}
          isMulti
          value={value}
          menuPosition="fixed"
          onChange={onChange}
          isDisabled={disabled}
        />
      </Label>
    </Box>
  );
};

interface TextParameterProps {
  parameter: TextItemSearchParameter;
  value?: string;
  onChange: (value: string | undefined) => void;
}

const TextParameter: React.FC<TextParameterProps> = (props) => {
  const { parameter, value, onChange } = props;
  return (
    <Box column>
      <Label>
        <ParameterName>{parameter.name}</ParameterName>
        <Input
          type="text"
          name={parameter.id}
          value={value || ""}
          onChange={(e) =>
            onChange(e.target.value ? e.target.value : undefined)
          }
        />
      </Label>
    </Box>
  );
};

const Form = styled.form`
  width: 100%;
`;

export const FieldSet = styled.fieldset`
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
`;

export const SearchButton = styled(Button)`
  margin: 10px 10px 0 0;
`;

const Field = styled(Box).attrs({
  column: true,
  paddedVertically: true
})``;

const ParameterName = styled(Text).attrs({
  semiBold: true,
  breakWord: true
})``;

const Label = styled.label``;

const HalfWidthLabel = styled(Label)`
  width: 45%;
  &:first-child {
    margin-right: 1em;
  }
`;

const Input = styled.input`
  color: ${(p) => p.theme.dark};
  box-sizing: border-box;
  width: 100%;
  height: 38px;
  font-size: 1.1em;
`;

const Select = styled(ReactSelect).attrs({
  classNamePrefix: "ReactSelect"
})`
  color: ${(p) => p.theme.dark};
  width: 100%;
  & .ReactSelect__control {
    border-radius: 0;
  }
`;

export default withTranslation()(SearchForm);
