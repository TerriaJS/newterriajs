import hoistStatics from "hoist-non-react-statics";
import {
  action,
  computed,
  observable,
  reaction,
  runInAction,
  makeObservable
} from "mobx";
import { observer } from "mobx-react";
import { IDisposer } from "mobx-utils";
import {
  RefObject,
  ChangeEvent,
  FC,
  Component,
  createRef,
  useState
} from "react";
import ReactDOM from "react-dom";
import { WithTranslation, withTranslation, TFunction } from "react-i18next";
import styled, { DefaultTheme, useTheme, withTheme } from "styled-components";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import LatLonHeight from "../../../Core/LatLonHeight";
import PickedFeatures from "../../../Map/PickedFeatures/PickedFeatures";
import prettifyCoordinates from "../../../Map/Vector/prettifyCoordinates";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import MappableMixin, {
  ImageryParts
} from "../../../ModelMixins/MappableMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import TerriaFeature from "../../../Models/Feature/Feature";
import hasTraits, { HasTrait } from "../../../Models/Definition/hasTraits";
import {
  getMarkerLocation,
  removeMarker
} from "../../../Models/LocationMarkerUtils";
import { EnumDimensionOption } from "../../../Models/SelectableDimensions/SelectableDimensions";
import SplitItemReference from "../../../Models/Catalog/CatalogReferences/SplitItemReference";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../../Styled/Box";
import Button, { RawButton } from "../../../Styled/Button";
import Select from "../../../Styled/Select";
import Spacing from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import ImageryProviderTraits from "../../../Traits/TraitsClasses/ImageryProviderTraits";
import { parseCustomMarkdownToReactWithOptions } from "../../Custom/parseCustomMarkdownToReact";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Loader from "../../Loader";
import DatePicker from "./DatePicker";
import LocationPicker from "./LocationPicker";
import { CLOSE_TOOL_ID } from "../../Map/MapNavigation/registerMapNavigations";
import updateModelFromJson from "../../../Models/Definition/updateModelFromJson";
import dateFormat from "dateformat";

type DiffableItem = DiffableMixin.Instance;

interface PropsType extends WithTranslation {
  viewState: ViewState;
  sourceItem: DiffableItem;
  theme: DefaultTheme;
}

@observer
class DiffTool extends Component<PropsType> {
  static readonly toolName = "Image Difference";

  @observable private leftItem?: DiffableItem;
  @observable private rightItem?: DiffableItem;
  @observable private userSelectedSourceItem?: DiffableItem;

  private splitterItemsDisposer?: IDisposer;
  private originalSettings: any;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
  }

  @computed
  get sourceItem(): DiffableItem {
    return this.userSelectedSourceItem || this.props.sourceItem;
  }

  @action.bound
  changeSourceItem(sourceItem: DiffableItem) {
    this.userSelectedSourceItem = sourceItem;
  }

  @action
  async createSplitterItems() {
    try {
      const [leftItem, rightItem] = await Promise.all([
        createSplitItem(this.sourceItem, SplitDirection.LEFT),
        createSplitItem(this.sourceItem, SplitDirection.RIGHT)
      ]);
      runInAction(() => {
        this.leftItem = leftItem;
        this.rightItem = rightItem;
      });
    } catch {}
  }

  @action
  removeSplitterItems() {
    if (this.leftItem) {
      removeSplitItem(this.leftItem);
    }
    if (this.rightItem) {
      removeSplitItem(this.rightItem);
    }
  }

  @action
  enterDiffTool() {
    // Start the reaction that splits the sourceItem into left & right items
    this.splitterItemsDisposer = reaction(
      () => this.sourceItem,
      () => {
        this.removeSplitterItems();
        this.createSplitterItems();
      },
      { fireImmediately: true }
    );

    const viewState = this.props.viewState;
    const terria = viewState.terria;
    this.originalSettings = {
      showSplitter: terria.showSplitter,
      isMapFullScreen: viewState.isMapFullScreen
    };
    terria.showSplitter = true;
    viewState.setIsMapFullScreen(true);
    this.sourceItem.setTrait(CommonStrata.user, "show", false);
    terria.mapNavigationModel.show(CLOSE_TOOL_ID);
    terria.elements.set("timeline", { visible: false });
    const closeTool = terria.mapNavigationModel.findItem(CLOSE_TOOL_ID);
    if (closeTool) {
      closeTool.controller.activate();
    }
  }

  @action
  leaveDiffTool() {
    const viewState = this.props.viewState;
    const terria = viewState.terria;
    const originalSettings = this.originalSettings;
    this.removeSplitterItems();
    this.splitterItemsDisposer?.();
    terria.showSplitter = originalSettings.showSplitter;
    viewState.setIsMapFullScreen(originalSettings.isMapFullScreen);
    this.sourceItem.setTrait(CommonStrata.user, "show", true);
    terria.mapNavigationModel.hide(CLOSE_TOOL_ID);
    terria.elements.set("timeline", { visible: true });
    const closeTool = terria.mapNavigationModel.findItem(CLOSE_TOOL_ID);
    if (closeTool) {
      closeTool.controller.deactivate();
    }
  }

  componentDidMount() {
    this.enterDiffTool();
  }

  componentWillUnmount() {
    this.leaveDiffTool();
  }

  render() {
    if (this.leftItem && this.rightItem) {
      return (
        <Main
          {...this.props}
          theme={this.props.theme}
          terria={this.props.viewState.terria}
          sourceItem={this.sourceItem}
          changeSourceItem={this.changeSourceItem}
          leftItem={this.leftItem}
          rightItem={this.rightItem}
        />
      );
    } else return null;
  }
}

interface MainPropsType extends PropsType {
  terria: Terria;
  leftItem: DiffableItem;
  rightItem: DiffableItem;
  changeSourceItem: (newSourceItem: DiffableItem) => void;
}

@observer
class Main extends Component<MainPropsType> {
  @observable private location?: LatLonHeight;
  @observable private _locationPickError = false;
  @observable private _isPickingNewLocation = false;

  private openLeftDatePickerButton: RefObject<HTMLButtonElement> = createRef();
  private openRightDatePickerButton: RefObject<HTMLButtonElement> = createRef();

  constructor(props: MainPropsType) {
    super(props);
    makeObservable(this);
  }

  @computed
  get locationPickerMessages() {
    const t = this.props.t;
    if (this._locationPickError) {
      return {
        title: t("diffTool.locationPicker.errorMessages.title"),
        beforePick: t("diffTool.locationPicker.errorMessages.beforePick"),
        afterPick: t("diffTool.locationPicker.errorMessages.afterPick")
      };
    } else if (this.location) {
      return {
        title: t(
          "diffTool.locationPicker.nextMessages.title",
          prettifyCoordinates(this.location.longitude, this.location.latitude, {
            digits: 2
          })
        ),
        beforePick: t("diffTool.locationPicker.nextMessages.beforePick"),
        afterPick: t("diffTool.locationPicker.nextMessages.afterPick")
      };
    } else {
      return {
        title: t("diffTool.locationPicker.initialMessages.title"),
        beforePick: t("diffTool.locationPicker.initialMessages.beforePick"),
        afterPick: t("diffTool.locationPicker.initialMessages.afterPick")
      };
    }
  }

  @computed
  get diffItem() {
    return this.props.leftItem;
  }

  @computed
  get diffItemName() {
    const name = this.props.sourceItem.name || "";
    const firstDate = this.leftDate;
    const secondDate = this.rightDate;
    const format = "yyyy/mm/dd";
    if (!firstDate || !secondDate) {
      return name;
    } else {
      const d1 = dateFormat(JulianDate.toDate(firstDate), format);
      const d2 = dateFormat(JulianDate.toDate(secondDate), format);
      return `${name} - difference for dates ${d1}, ${d2}`;
    }
  }

  @computed
  get diffableItemsInWorkbench(): DiffableItem[] {
    return this.props.terria.workbench.items.filter(
      (item) => DiffableMixin.isMixedInto(item) && item.canDiffImages
    ) as DiffableItem[];
  }

  @computed
  get previewStyle(): string | undefined {
    return this.diffItem.styleSelectableDimensions?.[0]?.selectedId;
  }

  @computed
  get diffStyle(): string | undefined {
    return this.diffItem.diffStyleId;
  }

  @computed
  get availableDiffStyles(): EnumDimensionOption[] {
    return filterOutUndefined(
      this.diffItem.availableDiffStyles.map((diffStyleId) =>
        this.diffItem.styleSelectableDimensions?.[0]?.options?.find(
          (style) => style.id === diffStyleId
        )
      )
    );
  }

  @computed
  get leftDate(): JulianDate | undefined {
    return this.props.leftItem.currentDiscreteJulianDate;
  }

  @computed
  get rightDate(): JulianDate | undefined {
    return this.props.rightItem.currentDiscreteJulianDate;
  }

  @computed
  get diffLegendUrl(): string | undefined {
    return (
      this.diffStyle &&
      this.leftDate &&
      this.rightDate &&
      this.diffItem.getLegendUrlForStyle(
        this.diffStyle,
        this.leftDate,
        this.rightDate
      )
    );
  }

  @computed
  get previewLegendUrl(): string | undefined {
    return (
      this.previewStyle && this.diffItem.getLegendUrlForStyle(this.previewStyle)
    );
  }

  @action
  showItem(model: DiffableItem) {
    // We change the opacity instead of setting `show` to true/false, because
    // we want the item to be on the map for date selection to work
    if (hasOpacity(model)) {
      model.setTrait(CommonStrata.user, "opacity", 0.8);
    }
  }

  @action
  hideItem(model: DiffableItem) {
    // We change the opacity instead of setting `show` to true/false, because
    // we want the item to be on the map for date selection to work
    if (hasOpacity(model)) {
      model.setTrait(CommonStrata.user, "opacity", 0);
    }
  }

  @action.bound
  changeSourceItem(e: ChangeEvent<HTMLSelectElement>) {
    const newSourceItem = this.diffableItemsInWorkbench.find(
      (item) => item.uniqueId === e.target.value
    );
    if (newSourceItem) this.props.changeSourceItem(newSourceItem);
  }

  @action.bound
  changePreviewStyle(e: ChangeEvent<HTMLSelectElement>) {
    const styleId = e.target.value;
    this.props.leftItem.styleSelectableDimensions?.[0]?.setDimensionValue(
      CommonStrata.user,
      styleId
    );
    this.props.rightItem.styleSelectableDimensions?.[0]?.setDimensionValue(
      CommonStrata.user,
      styleId
    );
  }

  @action.bound
  changeDiffStyle(e: ChangeEvent<HTMLSelectElement>) {
    this.diffItem.setTrait(CommonStrata.user, "diffStyleId", e.target.value);
  }

  @action.bound
  onUserPickingLocation(_pickingLocation: LatLonHeight) {
    this._isPickingNewLocation = true;
  }

  @action.bound
  onUserPickLocation(
    pickedFeatures: PickedFeatures,
    pickedLocation: LatLonHeight
  ) {
    const { leftItem, rightItem } = this.props;
    const feature = pickedFeatures.features.find(
      (f) =>
        doesFeatureBelongToItem(f, leftItem) ||
        doesFeatureBelongToItem(f, rightItem)
    );

    if (feature) {
      leftItem.setTimeFilterFeature(feature, pickedFeatures.providerCoords);
      rightItem.setTimeFilterFeature(feature, pickedFeatures.providerCoords);
      this.location = pickedLocation;
      this._locationPickError = false;
    } else {
      this._locationPickError = true;
    }
    this._isPickingNewLocation = false;
  }

  @action.bound
  unsetDates() {
    const { leftItem, rightItem } = this.props;
    leftItem.setTrait(CommonStrata.user, "currentTime", null);
    rightItem.setTrait(CommonStrata.user, "currentTime", null);
    this.hideItem(leftItem);
    this.hideItem(rightItem);
  }

  @action.bound
  generateDiff() {
    if (
      this.leftDate === undefined ||
      this.rightDate === undefined ||
      this.diffStyle === undefined
    ) {
      return;
    }

    const terria = this.props.terria;
    terria.overlays.remove(this.props.leftItem);
    terria.overlays.remove(this.props.rightItem);

    terria.workbench.add(this.diffItem);

    this.diffItem.setTrait(CommonStrata.user, "name", this.diffItemName);
    this.diffItem.showDiffImage(this.leftDate, this.rightDate, this.diffStyle);

    // If given, appply additional properties for the diff item
    const diffItemProperties = this.diffItem.diffItemProperties;
    if (diffItemProperties) {
      updateModelFromJson(this.diffItem, CommonStrata.user, diffItemProperties);
    }
    terria.showSplitter = false;
  }

  @action.bound
  resetTool() {
    const terria = this.props.terria;
    this.diffItem.clearDiffImage();
    setDefaultDiffStyle(this.diffItem);
    terria.overlays.add(this.props.leftItem);
    terria.overlays.add(this.props.rightItem);
    terria.workbench.remove(this.diffItem);
    this.props.terria.showSplitter = true;
    this.props.leftItem.setTrait(
      CommonStrata.user,
      "splitDirection",
      SplitDirection.LEFT
    );
    this.props.rightItem.setTrait(
      CommonStrata.user,
      "splitDirection",
      SplitDirection.RIGHT
    );
  }

  @action
  async setLocationFromActiveSearch() {
    // Look for any existing marker like from a search result and filter
    // imagery at that location
    const markerLocation = getMarkerLocation(this.props.terria);
    const sourceItem = this.props.sourceItem;
    if (markerLocation && MappableMixin.isMixedInto(sourceItem)) {
      const part = sourceItem.mapItems.find((p) => ImageryParts.is(p));
      const imageryProvider =
        part && ImageryParts.is(part) && part.imageryProvider;
      if (imageryProvider) {
        const promises = [
          setTimeFilterFromLocation(
            this.props.leftItem,
            markerLocation,
            imageryProvider
          ),
          setTimeFilterFromLocation(
            this.props.rightItem,
            markerLocation,
            imageryProvider
          )
        ];
        const someSuccessful = (await Promise.all(promises)).some((ok) => ok);
        if (someSuccessful) {
          runInAction(() => (this.location = markerLocation));
        } else {
          // If we cannot resolve imagery at the marker location, remove it
          removeMarker(this.props.terria);
        }
      }
    }
  }

  componentDidMount() {
    runInAction(() => {
      if (this.location === undefined) {
        const { latitude, longitude, height } =
          this.diffItem.timeFilterCoordinates;
        if (latitude !== undefined && longitude !== undefined) {
          this.location = {
            latitude,
            longitude,
            height
          };
          // remove any active search location marker to avoid showing two markers
          removeMarker(this.props.terria);
        } else {
          this.setLocationFromActiveSearch();
        }
      }
    });
  }

  // i want to restructure the render so that there's 2 distinct "showing diff"
  // or not states, right now intertwining them means way too many conditionals
  // that confuse the required spacing etc.
  render() {
    const { terria, viewState, sourceItem, t, theme } = this.props;
    const isShowingDiff = this.diffItem.isShowingDiff;
    const datesSelected = this.leftDate && this.rightDate;
    const isReadyToGenerateDiff =
      this.location && datesSelected && this.diffStyle !== undefined;

    return (
      <Text large>
        <DiffAccordion viewState={viewState} t={t}>
          <MainPanel
            isMapFullScreen={viewState.isMapFullScreen}
            styledMaxHeight={`calc(100vh - ${viewState.bottomDockHeight}px - 150px)`}
          >
            {isShowingDiff && (
              <>
                <Box centered left>
                  <BackButton
                    css={`
                      color: ${theme.textLight};
                      border-color: ${theme.textLight};
                    `}
                    transparentBg
                    onClick={this.resetTool}
                  >
                    <BoxSpan centered>
                      <StyledIcon
                        css="transform:rotate(90deg);"
                        light
                        styledWidth="16px"
                        glyph={GLYPHS.arrowDown}
                      />
                      <TextSpan noFontSize>{t("general.back")}</TextSpan>
                    </BoxSpan>
                  </BackButton>
                </Box>
                <Spacing bottom={3} />
                <Text medium textLight>
                  {t("diffTool.differenceResultsTitle")}
                </Text>
                <Spacing bottom={2} />
              </>
            )}
            <Text textLight>{t("diffTool.instructions.paneDescription")}</Text>
            <Spacing bottom={3} />
            <LocationAndDatesDisplayBox>
              <Box>
                <Text medium>{t("diffTool.labels.area")}:</Text>
                <div>
                  <Text medium textLightDimmed={!this.location}>
                    {this.location
                      ? t("diffTool.locationDisplay.locationSelected.title")
                      : t("diffTool.locationDisplay.noLocationSelected.title")}
                  </Text>
                  <Text light textLight small>
                    {this.location
                      ? t(
                          "diffTool.locationDisplay.locationSelected.description"
                        )
                      : t(
                          "diffTool.locationDisplay.noLocationSelected.description"
                        )}
                  </Text>
                </div>
              </Box>
              <Box>
                <Text medium>{t("diffTool.labels.dates")}:</Text>
                <Box column alignItemsFlexStart>
                  {this.leftDate && (
                    <Text large>
                      (A){" "}
                      {dateFormat(
                        JulianDate.toDate(this.leftDate),
                        "dd/mm/yyyy"
                      )}
                    </Text>
                  )}
                  {!this.leftDate && (
                    <RawButton ref={this.openLeftDatePickerButton}>
                      <TextSpan isLink small>
                        {t("diffTool.instructions.setDateA")}
                      </TextSpan>
                    </RawButton>
                  )}
                  <Spacing bottom={1} />
                  {this.rightDate && (
                    <Text large>
                      (B){" "}
                      {dateFormat(
                        JulianDate.toDate(this.rightDate),
                        "dd/mm/yyyy"
                      )}
                    </Text>
                  )}
                  {!this.rightDate && (
                    <RawButton ref={this.openRightDatePickerButton}>
                      <TextSpan isLink small>
                        {t("diffTool.instructions.setDateB")}
                      </TextSpan>
                    </RawButton>
                  )}
                  {isShowingDiff === false && this.leftDate && this.rightDate && (
                    <RawButton onClick={this.unsetDates}>
                      <TextSpan isLink small>
                        {t("diffTool.instructions.changeDates")}
                      </TextSpan>
                    </RawButton>
                  )}
                </Box>
              </Box>
            </LocationAndDatesDisplayBox>
            {!isShowingDiff && (
              <>
                <Spacing bottom={4} />
                <Selector
                  viewState={viewState}
                  value={sourceItem.uniqueId}
                  onChange={this.changeSourceItem}
                  label={t("diffTool.labels.sourceDataset")}
                >
                  <option disabled>Select source item</option>
                  {this.diffableItemsInWorkbench.map((item) => (
                    <option key={item.uniqueId} value={item.uniqueId}>
                      {item.name}
                    </option>
                  ))}
                </Selector>
              </>
            )}
            {!isShowingDiff && (
              <>
                <Spacing bottom={4} />
                <Selector
                  viewState={viewState}
                  spacingBottom
                  value={this.previewStyle}
                  onChange={this.changePreviewStyle}
                  label={t("diffTool.labels.previewStyle")}
                >
                  <option disabled value="">
                    {t("diffTool.choosePreview")}
                  </option>
                  {this.diffItem.styleSelectableDimensions?.[0]?.options?.map(
                    (style) => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    )
                  )}
                </Selector>
                {this.previewLegendUrl && (
                  <>
                    <Spacing bottom={2} />
                    <LegendImage width="100%" src={this.previewLegendUrl} />
                  </>
                )}
              </>
            )}
            <Spacing bottom={2} />
            <Selector
              viewState={viewState}
              value={this.diffStyle || ""}
              onChange={this.changeDiffStyle}
              label={t("diffTool.labels.differenceOutput")}
            >
              <option disabled value="">
                {t("diffTool.chooseDifference")}
              </option>
              {this.availableDiffStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </Selector>
            {isShowingDiff && this.diffLegendUrl && (
              <>
                <LegendImage width="100%" src={this.diffLegendUrl} />
                <Spacing bottom={4} />
              </>
            )}
            {!isShowingDiff && (
              <>
                <Spacing bottom={4} />
                <GenerateButton
                  onClick={this.generateDiff}
                  disabled={!isReadyToGenerateDiff}
                  aria-describedby="TJSDifferenceDisabledButtonPrompt"
                >
                  <TextSpan large>
                    {t("diffTool.labels.generateDiffButtonText")}
                  </TextSpan>
                </GenerateButton>

                {!isReadyToGenerateDiff && (
                  <>
                    <Spacing bottom={3} />
                    <Text
                      small
                      light
                      textLight
                      id="TJSDifferenceDisabledButtonPrompt"
                    >
                      {t("diffTool.labels.disabledButtonPrompt")}
                    </Text>
                    <Spacing bottom={4} />
                  </>
                )}
              </>
            )}
          </MainPanel>
        </DiffAccordion>
        {isShowingDiff && (
          <CloseDifferenceButton
            primary
            rounded
            textProps={{
              semiBold: true,
              extraLarge: true
            }}
            theme={theme}
            activeStyles
            onClick={this.resetTool}
            renderIcon={() => (
              <StyledIcon light styledWidth="13px" glyph={GLYPHS.closeLight} />
            )}
            iconProps={{
              css: `margin-right: 10px;`
            }}
          >
            Close
          </CloseDifferenceButton>
        )}
        {!isShowingDiff && (
          <LocationPicker
            terria={terria}
            location={this.location}
            onPicking={this.onUserPickingLocation}
            onPicked={this.onUserPickLocation}
          />
        )}
        {!isShowingDiff &&
          ReactDOM.createPortal(
            // Bottom Panel
            <Box centered fullWidth flexWrap backgroundColor={theme.dark}>
              <DatePicker
                heading={t("diffTool.labels.dateComparisonA")}
                item={this.props.leftItem}
                externalOpenButton={this.openLeftDatePickerButton}
                onDateSet={() => this.showItem(this.props.leftItem)}
              />
              <AreaFilterSelection
                t={t}
                location={this.location}
                isPickingNewLocation={this._isPickingNewLocation}
              />
              <DatePicker
                heading={t("diffTool.labels.dateComparisonB")}
                item={this.props.rightItem}
                externalOpenButton={this.openRightDatePickerButton}
                onDateSet={() => this.showItem(this.props.rightItem)}
              />
            </Box>,
            document.getElementById("TJS-BottomDockLastPortal")!
          )}
      </Text>
    );
  }
}

interface DiffAccordionProps {
  viewState: ViewState;
  t: TFunction;
}

const DiffAccordionToggle = styled(Box)`
  ${({ theme }) => theme.borderRadiusTop(theme.radius40Button)}
`;

const DiffAccordion: FC<DiffAccordionProps> = (props) => {
  const [showChildren, setShowChildren] = useState(true);
  const { t, viewState } = props;
  const theme = useTheme();
  return (
    <DiffAccordionWrapper isMapFullScreen={viewState.isMapFullScreen} column>
      {/* Diff header */}
      <DiffAccordionToggle
        paddedVertically
        paddedHorizontally={2}
        centered
        justifySpaceBetween
        backgroundColor={theme.colorSecondary}
      >
        <Box centered>
          <StyledIcon styledWidth="20px" light glyph={GLYPHS.difference} />
          <Spacing right={1} />
          <Text
            textLight
            semiBold
            // font-size is non standard with what we have so far in terria,
            // lineheight as well to hit nonstandard paddings
            styledFontSize="17px"
            styledLineHeight="30px"
          >
            {t("diffTool.title")}
          </Text>
        </Box>
        {/* margin-right 5px for the padded button offset - larger click area
            but visible should be inline with rest of box */}
        <Box centered css={"margin-right:-5px;"}>
          <RawButton onClick={() => viewState.closeTool()}>
            <TextSpan textLight small semiBold uppercase>
              {t("diffTool.exit")}
            </TextSpan>
          </RawButton>
          <Spacing right={4} />
          <RawButton onClick={() => setShowChildren(!showChildren)}>
            <BoxSpan paddedRatio={1} centered>
              <StyledIcon
                styledWidth="12px"
                light
                glyph={showChildren ? GLYPHS.opened : GLYPHS.closed}
              />
            </BoxSpan>
          </RawButton>
        </Box>
      </DiffAccordionToggle>
      {showChildren && props.children}
    </DiffAccordionWrapper>
  );
};

const DiffAccordionWrapper = styled(Box).attrs({
  column: true,
  position: "absolute",
  styledWidth: "340px"
  // charcoalGreyBg: true
})<{ isMapFullScreen: boolean }>`
  top: 70px;
  left: 0px;
  min-height: 220px;
  // background: ${(p) => p.theme.dark};
  margin-left: ${(props) =>
    props.isMapFullScreen
      ? 16
      : parseInt(props.theme.workbenchWidth, 10) + 40}px;
  transition: margin-left 0.25s;
`;

const MainPanel = styled(Box).attrs({
  column: true,
  overflowY: "auto",
  paddedRatio: 2
})<{ isMapFullScreen: boolean }>`
  ${({ theme }) => theme.borderRadiusBottom(theme.radius40Button)}
  background-color: ${(p) => p.theme.darkWithOverlay};
`;

const BackButton = styled(Button).attrs({
  secondary: true
})``;

const CloseDifferenceButton = styled(Button)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 18px;
  padding: 0 20px;
`;

const GenerateButton = styled(Button).attrs({
  primary: true,
  splitter: true,
  fullWidth: true
})``;

const Selector = (props: any) => (
  <Box fullWidth column>
    <label>
      {/* <Text textLight>{props.label}:</Text> */}
      <Text textLight css={"p {margin: 0;}"}>
        {parseCustomMarkdownToReactWithOptions(`${props.label}:`, {
          injectTermsAsTooltips: true,
          tooltipTerms: props.viewState.terria.configParameters.helpContentTerms
        })}
      </Text>
      <Spacing bottom={1} />
      <Select {...props}>{props.children}</Select>
      {props.spacingBottom && <Spacing bottom={2} />}
    </label>
  </Box>
);

const AreaFilterSelection = (props: {
  t: TFunction;
  location?: LatLonHeight;
  isPickingNewLocation: boolean;
  theme?: any;
}) => {
  const { t, location, isPickingNewLocation } = props;
  let locationText = "-";
  if (location) {
    const { longitude, latitude } = prettifyCoordinates(
      location.longitude,
      location.latitude,
      {
        digits: 2
      }
    );
    locationText = `${longitude} ${latitude}`;
  }

  return (
    <Box
      column
      centered
      styledMinWidth="230px"
      css={`
        @media (max-width: ${(props: any) => props.theme.md}px) {
          width: 100%;
        }
      `}
    >
      <Box centered>
        <StyledIcon light styledWidth="16px" glyph={GLYPHS.location2} />
        <Spacing right={2} />
        <Text textLight extraLarge>
          {t("diffTool.labels.areaFilterSelection")}
        </Text>
      </Box>
      <Spacing bottom={3} />
      <Box styledMinHeight="40px">
        {isPickingNewLocation ? (
          <Text
            textLight
            extraExtraLarge
            bold
            // Using legacy Loader.jsx means we override at a higher level to inherit
            // this fills tyle
            css={`
              fill: ${({ theme }: any) => theme.textLight};
            `}
          >
            <Loader
              light
              message={`Querying ${location ? "new" : ""} position...`}
            />
          </Text>
        ) : (
          <Text textLight bold heading textAlignCenter>
            {locationText}
          </Text>
        )}
      </Box>
    </Box>
  );
};

const LocationAndDatesDisplayBox = styled(Box).attrs({
  column: true,
  charcoalGreyBg: true
})`
  color: ${(p) => p.theme.textLight};
  padding: 15px;
  > ${Box}:first-child {
    margin-bottom: 13px;
  }
  > div > div:first-child {
    /* The labels */
    margin-right: 5px;
    min-width: 50px;
  }
`;

const LegendImage = function (props: any) {
  return (
    <img
      {...props}
      // Show the legend only if it loads successfully, so we start out hidden
      style={{ display: "none", marginTop: "4px" }}
      onLoad={(e) => (e.currentTarget.style.display = "block")}
      onError={(e) => (e.currentTarget.style.display = "none")}
    />
  );
};

async function createSplitItem(
  sourceItem: DiffableItem,
  splitDirection: SplitDirection
): Promise<DiffableItem> {
  const terria = sourceItem.terria;
  const ref = new SplitItemReference(createGuid(), terria);
  ref.setTrait(CommonStrata.user, "splitSourceItemId", sourceItem.uniqueId);
  terria.addModel(ref);
  await ref.loadReference();
  return runInAction(() => {
    if (ref.target === undefined) {
      throw Error("failed to split item");
    }
    const newItem = ref.target as DiffableItem;
    newItem.setTrait(CommonStrata.user, "show", true);
    newItem.setTrait(CommonStrata.user, "splitDirection", splitDirection);
    newItem.setTrait(CommonStrata.user, "currentTime", null);
    newItem.setTrait(CommonStrata.user, "initialTimeSource", "none");
    if (hasOpacity(newItem)) {
      // We want to show the item on the map only after date selection. At the
      // same time we cannot set `show` to false because if we
      // do so, date picking which relies on feature picking, will not work. So
      // we simply set the opacity of the item to 0.
      newItem.setTrait(CommonStrata.user, "opacity", 0);
    }

    // Override feature info template as the parent featureInfoTemplate might
    // not be relevant for the difference item. This has to be done in the user
    // stratum to override template set in definition stratum.
    updateModelFromJson(newItem, CommonStrata.user, {
      featureInfoTemplate: { template: "" }
    });

    setDefaultDiffStyle(newItem);

    // Set the default style to true color style if it exists
    const trueColor = newItem.styleSelectableDimensions?.[0]?.options?.find(
      (style) => isDefined(style.name) && style.name.search(/true/i) >= 0
    );
    if (trueColor?.id) {
      newItem.styleSelectableDimensions?.[0]?.setDimensionValue(
        CommonStrata.user,
        trueColor.id
      );
    }

    terria.overlays.add(newItem);
    return newItem;
  });
}

/**
 * If the item has only one available diff style, auto-select it
 */
function setDefaultDiffStyle(item: DiffableItem) {
  if (item.diffStyleId !== undefined) {
    return;
  }

  const availableStyles = filterOutUndefined(
    item.availableDiffStyles.map((diffStyleId) =>
      item.styleSelectableDimensions?.[0]?.options?.find(
        (style) => style.id === diffStyleId
      )
    )
  );

  if (availableStyles.length === 1) {
    item.setTrait(CommonStrata.user, "diffStyleId", availableStyles[0].id);
  }
}

function removeSplitItem(item: DiffableItem) {
  const terria = item.terria;
  terria.overlays.remove(item);
  if (item.sourceReference && terria.workbench.contains(item) === false) {
    terria.removeModelReferences(item.sourceReference);
  }
}

function doesFeatureBelongToItem(
  feature: TerriaFeature,
  item: DiffableItem
): boolean {
  if (!MappableMixin.isMixedInto(item)) return false;
  const imageryProvider = feature.imageryLayer?.imageryProvider;
  if (imageryProvider === undefined) return false;
  return (
    item.mapItems.find(
      (m) => ImageryParts.is(m) && m.imageryProvider === imageryProvider
    ) !== undefined
  );
}

function setTimeFilterFromLocation(
  item: DiffableItem,
  location: LatLonHeight,
  im: ImageryProvider
): Promise<boolean> {
  const carto = new Cartographic(
    CesiumMath.toRadians(location.longitude),
    CesiumMath.toRadians(location.latitude)
  );
  // We just need to set this to a high enough level supported by the service
  const level = 30;
  const tile = im.tilingScheme.positionToTileXY(carto, level);
  return item.setTimeFilterFromLocation({
    position: {
      latitude: location.latitude,
      longitude: location.longitude,
      height: location.height
    },
    tileCoords: {
      x: tile.x,
      y: tile.y,
      level
    }
  });
}

function hasOpacity(
  model: any
): model is HasTrait<ImageryProviderTraits, "opacity"> {
  return hasTraits(model, ImageryProviderTraits, "opacity");
}

export default hoistStatics(withTranslation()(withTheme(DiffTool)), DiffTool);
