import { action } from "mobx";
import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import { filterSelectableDimensions } from "../../Models/SelectableDimensions/SelectableDimensions";
import SelectableDimension from "../SelectableDimensions/SelectableDimension";
import { useViewState } from "../Context";
import WorkbenchItemControls, {
  hideAllControls
} from "../Workbench/Controls/WorkbenchItemControls";
import { Panel } from "./Panel";
import { PanelMenu } from "./PanelMenu";
import WorkflowPanel from "./WorkflowPanel";

/** Two main components:
 * - Title panel with `title`, item `WorkbenchItemControls` and menu
 * - Panel for each top-level selectable dimension
 */
const SelectableDimensionWorkflow: FC<React.PropsWithChildren<unknown>> =
  observer(() => {
    const viewState = useViewState();
    const terria = viewState.terria;
    const [t] = useTranslation();

    return terria.selectableDimensionWorkflow ? (
      <WorkflowPanel
        viewState={viewState}
        icon={terria.selectableDimensionWorkflow.icon}
        title={terria.selectableDimensionWorkflow.name}
        closeButtonText={t("compare.done")}
        onClose={action(() => {
          terria.selectableDimensionWorkflow = undefined;
        })}
        footer={terria.selectableDimensionWorkflow.footer}
      >
        {/* Render first panel with `title`, item `WorkbenchItemControls` and menu */}
        <Panel
          title={getName(terria.selectableDimensionWorkflow.item)}
          menuComponent={
            terria.selectableDimensionWorkflow.menu ? (
              <PanelMenu {...terria.selectableDimensionWorkflow.menu} />
            ) : undefined
          }
        >
          <WorkbenchItemControls
            item={terria.selectableDimensionWorkflow.item}
            viewState={viewState}
            controls={{
              ...hideAllControls,
              opacity: true,
              timer: true,
              dateTime: true,
              shortReport: true
            }}
          />
        </Panel>
        {/* Render Panel for each top-level selectable dimension */}
        {terria.selectableDimensionWorkflow.selectableDimensions.map(
          (groupDim, _i) => {
            if (groupDim.disable) return null;

            const childDims = filterSelectableDimensions()(
              groupDim.selectableDimensions
            );

            if (childDims.length === 0) return null;

            return (
              <Panel
                title={groupDim.name ?? groupDim.id}
                key={groupDim.name ?? groupDim.id}
                isOpen={groupDim.isOpen ?? true}
                onToggle={groupDim.onToggle}
                collapsible
              >
                {childDims.map((childDim) => (
                  <SelectableDimension
                    key={`${terria.selectableDimensionWorkflow?.item.uniqueId}-${childDim.id}-fragment`}
                    id={`${terria.selectableDimensionWorkflow?.item.uniqueId}-${childDim.id}`}
                    dim={childDim}
                  />
                ))}
              </Panel>
            );
          }
        )}
      </WorkflowPanel>
    ) : null;
  });

export default SelectableDimensionWorkflow;
