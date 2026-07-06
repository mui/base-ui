"use client";

import { useClientRowDataSource, Grid } from "@1771technologies/lytenyte-pro";
import "@1771technologies/lytenyte-pro/grid.css";
import type { Column } from "@1771technologies/lytenyte-pro/types";
import { bankDataSmall } from "@1771technologies/grid-sample-data/bank-data-smaller";
import { Popover } from "@base-ui-components/react/popover";
import { useId } from "react";

type BankData = (typeof bankDataSmall)[number];

const columns: Column<BankData>[] = [
  { id: "age", type: "number" },
  { id: "job" },
  { id: "balance", type: "number" },
  { id: "education" },
  { id: "marital" },
  { id: "default" },
  { id: "housing" },
  { id: "loan" },
  { id: "contact" },
  { id: "day", type: "number" },
  { id: "month" },
  { id: "duration" },
  { id: "campaign" },
  { id: "pdays" },
  { id: "previous" },
  { id: "poutcome", name: "P Outcome" },
  { id: "y" },
];

export default function PopoverFrame() {
  const ds = useClientRowDataSource({ data: bankDataSmall });

  const grid = Grid.useLyteNyte({
    gridId: useId(),
    rowDataSource: ds,
    columns,

    popoverFrames: {
      myFrame: {
        component: (params) => {
          return (
            <Popover.Root
              open
              onOpenChange={(b) => !b && params.grid.api.popoverFrameClose()}
              key={params.context.columnId + params.context.rowIndex}
            >
              <Popover.Portal>
                <Popover.Positioner anchor={params.target}>
                  <Popover.Popup className="border-ln-gray-50 bg-ln-gray-10 fixed z-50 w-[200px] rounded border px-4">
                    This is my popover frame content. This popover is for for the cell at row{" "}
                    {params.context.rowIndex} with column id {params.context.columnId}.
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          );
        },
      },
    },
  });

  const view = grid.view.useValue();

  return (
    <div>
      <div className="lng-grid" style={{ height: 500 }}>
        <Grid.Root grid={grid}>
          <Grid.Viewport>
            <Grid.Header>
              {view.header.layout.map((row, i) => {
                return (
                  <Grid.HeaderRow key={i} headerRowIndex={i}>
                    {row.map((c) => {
                      if (c.kind === "group") return null;

                      return (
                        <Grid.HeaderCell
                          key={c.id}
                          cell={c}
                          className="flex h-full w-full items-center px-2 capitalize"
                        />
                      );
                    })}
                  </Grid.HeaderRow>
                );
              })}
            </Grid.Header>
            <Grid.RowsContainer>
              <Grid.RowsCenter>
                {view.rows.center.map((row) => {
                  if (row.kind === "full-width") return null;

                  return (
                    <Grid.Row row={row} key={row.id}>
                      {row.cells.map((c) => {
                        return (
                          <Grid.Cell
                            key={c.id}
                            cell={c}
                            className="flex h-full w-full items-center px-2 text-sm"
                            onClick={(e) => {
                              grid.api.popoverFrameClose();
                              grid.api.popoverFrameOpen("myFrame", e.currentTarget, {
                                rowIndex: c.rowIndex,
                                columnId: c.column.id,
                              });
                            }}
                          />
                        );
                      })}
                    </Grid.Row>
                  );
                })}
              </Grid.RowsCenter>
            </Grid.RowsContainer>
          </Grid.Viewport>
        </Grid.Root>
      </div>
    </div>
  );
}
