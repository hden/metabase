import userEvent from "@testing-library/user-event";
import nock from "nock";

import { screen, waitForElementToBeRemoved } from "__support__/ui";

import { generateSchemaId } from "metabase-lib/metadata/utils/schema";

import {
  setup,
  SAMPLE_DATABASE,
  ANOTHER_DATABASE,
  MULTI_SCHEMA_DATABASE,
} from "./common";

describe("DataPicker — picking raw data", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("opens the picker", async () => {
    await setup();

    userEvent.click(screen.getByText(/Raw Data/i));
    await waitForElementToBeRemoved(() =>
      screen.queryByTestId("loading-spinner"),
    );

    expect(screen.getByText(SAMPLE_DATABASE.name)).toBeInTheDocument();
    SAMPLE_DATABASE.tables?.forEach(table => {
      expect(screen.getByText(table.name)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Models/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Saved Questions/i)).not.toBeInTheDocument();
  });

  it("has empty state", async () => {
    await setup({ hasEmptyDatabase: true });

    userEvent.click(screen.getByText(/Raw Data/i));
    userEvent.click(screen.getByText(ANOTHER_DATABASE.name));

    expect(await screen.findByText(/Nothing here/i)).toBeInTheDocument();
  });

  it("allows to pick multiple tables", async () => {
    const { onChange } = await setup({ isMultiSelect: true });

    userEvent.click(screen.getByText(/Raw Data/i));
    userEvent.click(await screen.findByText(/Orders/i));
    userEvent.click(screen.getByText(/Products/i));
    userEvent.click(screen.getByText(/People/i));
    userEvent.click(screen.getByText(/Orders/i));

    expect(onChange).toHaveBeenLastCalledWith({
      type: "raw-data",
      databaseId: SAMPLE_DATABASE.id,
      schemaId: generateSchemaId(SAMPLE_DATABASE.id, "PUBLIC"),
      tableIds: [1, 3],
    });
  });

  it("allows to return to the data type picker", async () => {
    await setup();

    userEvent.click(screen.getByText(/Raw Data/i));
    await waitForElementToBeRemoved(() =>
      screen.queryByTestId("loading-spinner"),
    );
    userEvent.click(screen.getByRole("button", { name: /Back/i }));

    expect(screen.getByText(/Models/i)).toBeInTheDocument();
    expect(screen.getByText(/Raw Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Saved Questions/i)).toBeInTheDocument();

    expect(screen.queryByText(SAMPLE_DATABASE.name)).not.toBeInTheDocument();
    SAMPLE_DATABASE.tables?.forEach(table => {
      expect(screen.queryByText(table.name)).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /Back/i }),
    ).not.toBeInTheDocument();
  });

  it("allows to pick a single table", async () => {
    const { onChange } = await setup();

    userEvent.click(screen.getByText(/Raw Data/i));
    userEvent.click(await screen.findByText("Orders"));
    userEvent.click(screen.getByText("Products"));

    const selectedItem = screen.getByRole("menuitem", {
      name: /Products/i,
    });
    expect(selectedItem).toHaveAttribute("aria-selected", "true");
    expect(onChange).toHaveBeenCalledWith({
      type: "raw-data",
      databaseId: SAMPLE_DATABASE.id,
      schemaId: generateSchemaId(SAMPLE_DATABASE.id, "PUBLIC"),
      tableIds: [1],
    });
  });

  describe("given a single-schema database", () => {
    it("respects initial value", async () => {
      await setup({
        initialValue: {
          type: "raw-data",
          databaseId: SAMPLE_DATABASE.id,
          schemaId: generateSchemaId(SAMPLE_DATABASE.id, "PUBLIC"),
          tableIds: [1],
        },
        filters: {
          types: type => type === "raw-data",
        },
      });

      const tableListItem = await screen.findByRole("menuitem", {
        name: /Products/i,
      });
      const databaseListItem = screen.getByRole("menuitem", {
        name: SAMPLE_DATABASE.name,
      });

      expect(tableListItem).toHaveAttribute("aria-selected", "true");
      expect(databaseListItem).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("given a multiple-schema database", () => {
    it("respects initial value", async () => {
      const [table] = MULTI_SCHEMA_DATABASE.tables ?? [];
      const schema = table.schema;

      await setup({
        hasMultiSchemaDatabase: true,
        initialValue: {
          type: "raw-data",
          databaseId: MULTI_SCHEMA_DATABASE.id,
          schemaId: generateSchemaId(MULTI_SCHEMA_DATABASE.id, schema),
          tableIds: [table.id],
        },
      });

      const schemaListItem = await screen.findByRole("menuitem", {
        name: schema,
      });
      const tableListItem = await screen.findByRole("menuitem", {
        name: table.name,
      });
      const databaseListItem = screen.getByRole("menuitem", {
        name: MULTI_SCHEMA_DATABASE.name,
      });

      expect(schemaListItem).toHaveAttribute("aria-selected", "true");
      expect(databaseListItem).toHaveAttribute("aria-selected", "false");
      expect(tableListItem).toHaveAttribute("aria-selected", "true");
    });

    it("resets selected tables on schema change", async () => {
      const [schema1Table, schema2Table] = MULTI_SCHEMA_DATABASE.tables ?? [];
      const schema1 = schema1Table.schema;
      const schema2 = schema2Table.schema;

      const { onChange } = await setup({ hasMultiSchemaDatabase: true });

      userEvent.click(screen.getByText(/Raw Data/i));
      userEvent.click(screen.getByText(MULTI_SCHEMA_DATABASE.name));
      userEvent.click(await screen.findByText(schema1));
      userEvent.click(await screen.findByText(schema1Table.name));
      userEvent.click(await screen.findByText(schema2));

      expect(onChange).toHaveBeenLastCalledWith({
        type: "raw-data",
        databaseId: MULTI_SCHEMA_DATABASE.id,
        schemaId: generateSchemaId(MULTI_SCHEMA_DATABASE.id, schema2),
        tableIds: [],
      });
    });
  });

  describe("given many databases", () => {
    it("resets selected tables on database change", async () => {
      const { onChange } = await setup({ hasMultiSchemaDatabase: true });

      userEvent.click(screen.getByText(/Raw Data/i));
      userEvent.click(screen.getByText(SAMPLE_DATABASE.name));
      userEvent.click(await screen.findByText(/Orders/i));
      userEvent.click(screen.getByText(MULTI_SCHEMA_DATABASE.name));

      expect(onChange).toHaveBeenLastCalledWith({
        type: "raw-data",
        databaseId: MULTI_SCHEMA_DATABASE.id,
        schemaId: undefined,
        tableIds: [],
      });
    });
  });

  it("resets selection when going back to data type picker", async () => {
    const { onChange } = await setup();

    userEvent.click(screen.getByText(/Raw Data/i));
    userEvent.click(await screen.findByText(/Orders/i));
    userEvent.click(screen.getByRole("button", { name: /Back/i }));

    expect(onChange).toHaveBeenLastCalledWith({
      type: undefined,
      databaseId: undefined,
      schemaId: undefined,
      collectionId: undefined,
      tableIds: [],
    });
  });
});
