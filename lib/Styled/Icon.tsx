import classNames from "classnames";
import React from "react";
import styled from "styled-components";

// Import icon SVGs
import calendar from "../../wwwroot/images/icons/calendar.svg";
import calendar2 from "../../wwwroot/images/icons/calendar2.svg";
import about from "../../wwwroot/images/icons/about.svg";
import add from "../../wwwroot/images/icons/add.svg";
import arHover0 from "../../wwwroot/images/icons/ar-hover0.svg";
import arHover1 from "../../wwwroot/images/icons/ar-hover1.svg";
import arHover2 from "../../wwwroot/images/icons/ar-hover2.svg";
import arOff from "../../wwwroot/images/icons/ar-off.svg";
import arOn from "../../wwwroot/images/icons/ar-on.svg";
import arRealign from "../../wwwroot/images/icons/ar-realign.svg";
import arResetAlignment from "../../wwwroot/images/icons/ar-reset-alignment.svg";
import arrowDown from "../../wwwroot/images/icons/arrow-down.svg";
import backToStart from "../../wwwroot/images/icons/back-to-start.svg";
import backward from "../../wwwroot/images/icons/backward.svg";
import barChart from "../../wwwroot/images/icons/bar-chart.svg";
import bulb from "../../wwwroot/images/icons/bulb.svg";
import controls from "../../wwwroot/images/icons/controls.svg";
import checkboxIndeterminate from "../../wwwroot/images/icons/checkbox-indeterminate.svg";
import checkboxOff from "../../wwwroot/images/icons/checkbox-off.svg";
import checkboxOn from "../../wwwroot/images/icons/checkbox-on.svg";
import close from "../../wwwroot/images/icons/close.svg";
import closeLight from "../../wwwroot/images/icons/close-light.svg";
import closed from "../../wwwroot/images/icons/closed.svg";
import decrease from "../../wwwroot/images/icons/decrease.svg";
import download from "../../wwwroot/images/icons/download.svg";
import downloadNew from "../../wwwroot/images/icons/download-new.svg";
import expand from "../../wwwroot/images/icons/expand.svg";
import eye from "../../wwwroot/images/icons/eye.svg";
import externalLink from "../../wwwroot/images/icons/external-link.svg";
import feedback from "../../wwwroot/images/icons/feedback.svg";
import folder from "../../wwwroot/images/icons/folder.svg";
import folderOpen from "../../wwwroot/images/icons/folder-open.svg";
import forward from "../../wwwroot/images/icons/forward.svg";
import geolocation from "../../wwwroot/images/icons/geolocation.svg";
import gallery from "../../wwwroot/images/icons/gallery.svg";
import help from "../../wwwroot/images/icons/help.svg";
import helpThick from "../../wwwroot/images/icons/help-thick.svg";
import increase from "../../wwwroot/images/icons/increase.svg";
import left from "../../wwwroot/images/icons/left.svg";
import lineChart from "../../wwwroot/images/icons/line-chart.svg";
import link from "../../wwwroot/images/icons/link.svg";
import loader from "../../wwwroot/images/icons/loader.svg";
import location from "../../wwwroot/images/icons/location.svg";
import location2 from "../../wwwroot/images/icons/location2.svg";
import lock from "../../wwwroot/images/icons/lock.svg";
import loop from "../../wwwroot/images/icons/loop.svg";
import menu from "../../wwwroot/images/icons/menu.svg";
import measure from "../../wwwroot/images/icons/measure.svg";
import opened from "../../wwwroot/images/icons/opened.svg";
import pause from "../../wwwroot/images/icons/pause.svg";
import play from "../../wwwroot/images/icons/play.svg";
import playStory from "../../wwwroot/images/icons/play-story.svg";
import radioOff from "../../wwwroot/images/icons/radio-off.svg";
import radioOn from "../../wwwroot/images/icons/radio-on.svg";
import refresh from "../../wwwroot/images/icons/refresh.svg";
import remove from "../../wwwroot/images/icons/remove.svg";
import right from "../../wwwroot/images/icons/right.svg";
import right2 from "../../wwwroot/images/icons/right2.svg";
import revert from "../../wwwroot/images/icons/revert.svg";
import search from "../../wwwroot/images/icons/search.svg";
import selected from "../../wwwroot/images/icons/selected.svg";
import settings from "../../wwwroot/images/icons/settings.svg";
import share from "../../wwwroot/images/icons/share.svg";
import showLess from "../../wwwroot/images/icons/show-less.svg";
import showMore from "../../wwwroot/images/icons/show-more.svg";
import sphere from "../../wwwroot/images/icons/sphere.svg";
import map from "../../wwwroot/images/icons/map.svg";
import splitter from "../../wwwroot/images/icons/splitter.svg";
import splitterOn from "../../wwwroot/images/icons/splitterOn.svg";
import splitterOff from "../../wwwroot/images/icons/splitterOff.svg";
import difference from "../../wwwroot/images/icons/difference.svg";
import diffImage from "../../wwwroot/images/icons/splitter.svg";
import previous from "../../wwwroot/images/icons/previous.svg";
import next from "../../wwwroot/images/icons/next.svg";
import timeline from "../../wwwroot/images/icons/timeline.svg";
import data from "../../wwwroot/images/icons/data.svg";
import dataCatalog from "../../wwwroot/images/icons/dataCatalog.svg";
import upload from "../../wwwroot/images/icons/upload.svg";
import trashcan from "../../wwwroot/images/icons/trashcan.svg";
import local from "../../wwwroot/images/icons/localfile.svg";
import web from "../../wwwroot/images/icons/remotefile.svg";
import compassInner from "../../wwwroot/images/icons/compass-inner.svg";
import compassInnerArrows from "../../wwwroot/images/icons/compass-inner-arrows.svg";
import compassOuter from "../../wwwroot/images/icons/compass-outer.svg";
import compassOuterSkeleton from "../../wwwroot/images/icons/compass-outer-skeleton.svg";
import compassOuterEnlarged from "../../wwwroot/images/icons/compass-outer-enlarged.svg";
import compassRotationMarker from "../../wwwroot/images/icons/compass-rotation-marker.svg";
import circleFull from "../../wwwroot/images/icons/circlef-full.svg";
import circleEmpty from "../../wwwroot/images/icons/circle-empty.svg";
import story from "../../wwwroot/images/icons/story.svg";
import recapture from "../../wwwroot/images/icons/recapture.svg";
import menuDotted from "../../wwwroot/images/icons/menu-dotted.svg";
import cancel from "../../wwwroot/images/icons/cancel.svg";
import user from "../../wwwroot/images/icons/user.svg";
import datePicker from "../../wwwroot/images/icons/date-picker-icon.svg";
import tour from "../../wwwroot/images/icons/take-the-tour-icon.svg";
import layers from "../../wwwroot/images/icons/pulling-away-layers-icon.svg";
import start from "../../wwwroot/images/icons/getting-started-icon.svg";
import cube from "../../wwwroot/images/icons/interact.svg";
import globe from "../../wwwroot/images/icons/globe.svg";
import playInverted from "../../wwwroot/images/icons/play-inverted.svg";
import video from "../../wwwroot/images/icons/video.svg";
import compare from "../../wwwroot/images/icons/compare.svg";
import lifesaver from "../../wwwroot/images/icons/help-2.svg";
import geolocationThick from "../../wwwroot/images/icons/location-thick.svg";
import minus from "../../wwwroot/images/icons/minus.svg";
import plus from "../../wwwroot/images/icons/plus.svg";
import zoomIn from "../../wwwroot/images/icons/zoom-in.svg";
import zoomOut from "../../wwwroot/images/icons/zoom-out.svg";
import zoomReset from "../../wwwroot/images/icons/zoom-reset.svg";
import satellite from "../../wwwroot/images/icons/satellite.svg";
import mapDataActive from "../../wwwroot/images/icons/map-data-active.svg";
import mapDataInactive from "../../wwwroot/images/icons/map-data-inactive.svg";
import uploadThin from "../../wwwroot/images/icons/upload-thin.svg";
import oneTwoThree from "../../wwwroot/images/icons/one-two-three.svg";
import accordionOpen from "../../wwwroot/images/icons/accordion-open.svg";
import accordionClose from "../../wwwroot/images/icons/accordion-close.svg";
import editor from "../../wwwroot/images/icons/editor.svg";
import viewStory from "../../wwwroot/images/icons/view-story.svg";
import editStory from "../../wwwroot/images/icons/edit-story.svg";
import questionMark from "../../wwwroot/images/icons/questionmark.svg";
import pedestrian from "../../wwwroot/images/icons/pedestrian.svg";
import minimize from "../../wwwroot/images/icons/minimize.svg";
import maximize from "../../wwwroot/images/icons/maximize.svg";
import closeTool from "../../wwwroot/images/icons/close-tool.svg";
import moreItems from "../../wwwroot/images/icons/more-items.svg";
import info from "../../wwwroot/images/icons/info.svg";
import leftSmall from "../../wwwroot/images/icons/left-small.svg";
import rightSmall from "../../wwwroot/images/icons/right-small.svg";
import compareLeftPanel from "../../wwwroot/images/icons/compare-left-panel.svg";
import compareRightPanel from "../../wwwroot/images/icons/compare-right-panel.svg";
import compareBothPanels from "../../wwwroot/images/icons/compare-both-panels.svg";
import closeCircle from "../../wwwroot/images/icons/close-circle.svg";
import plusList from "../../wwwroot/images/icons/plus-list-20.svg";
import minusList from "../../wwwroot/images/icons/dismiss-20.svg";

// Icon
export const GLYPHS = {
  calendar,
  calendar2,
  about,
  add,
  arHover0,
  arHover1,
  arHover2,
  arOff,
  arOn,
  arRealign,
  arResetAlignment,
  arrowDown,
  backToStart,
  backward,
  barChart,
  bulb,
  controls,
  checkboxIndeterminate,
  checkboxOff,
  checkboxOn,
  close,
  closeLight,
  closed,
  decrease,
  download,
  downloadNew,
  expand,
  eye,
  externalLink,
  feedback,
  folder,
  folderOpen,
  forward,
  geolocation,
  gallery,
  help,
  helpThick,
  increase,
  left,
  lineChart,
  link,
  loader,
  location,
  location2,
  lock,
  loop,
  menu,
  measure,
  opened,
  pause,
  play,
  playStory,
  radioOff,
  radioOn,
  refresh,
  remove,
  right,
  right2,
  revert,
  search,
  selected,
  settings,
  share,
  showLess,
  showMore,
  sphere,
  map,
  splitter,
  splitterOn,
  splitterOff,
  difference,
  diffImage,
  previous,
  next,
  timeline,
  data,
  dataCatalog,
  upload,
  trashcan,
  local,
  web,
  compassInner,
  compassInnerArrows,
  compassOuter,
  compassOuterSkeleton,
  compassOuterEnlarged,
  compassRotationMarker,
  circleFull,
  circleEmpty,
  story,
  recapture,
  menuDotted,
  cancel,
  user,
  datePicker,
  tour,
  layers,
  start,
  cube,
  globe,
  playInverted,
  video,
  compare,
  lifesaver,
  geolocationThick,
  minus,
  plus,
  zoomIn,
  zoomOut,
  zoomReset,
  satellite,
  mapDataActive,
  mapDataInactive,
  uploadThin,
  oneTwoThree,
  accordionOpen,
  accordionClose,
  editor,
  viewStory,
  editStory,
  questionMark,
  pedestrian,
  minimize,
  maximize,
  closeTool,
  moreItems,
  info,
  leftSmall,
  rightSmall,
  compareLeftPanel,
  compareRightPanel,
  compareBothPanels,
  closeCircle,
  plusList,
  minusList
};

export interface IconGlyph {
  id: string;
}

export interface IconProps {
  glyph: IconGlyph;
  style?: any;
  className?: string;
  rotation?: number;
}
export const Icon: React.FC<IconProps> = (props: IconProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={classNames("icon", props.className)}
      style={props.style}
      transform={`rotate(${props.rotation ?? 0})`}
    >
      <use xlinkHref={"#" + props.glyph?.id} />
    </svg>
  );
};

export interface IStyledIconProps {
  displayInline?: boolean;
  styledWidth?: string;
  styledHeight?: string;
  light?: boolean;
  dark?: boolean;
  realDark?: boolean;
  fillColor?: string;
  opacity?: number;
}

export const StyledIcon = styled(Icon) <IStyledIconProps>`
  display: ${(props) => (props.displayInline ? `inline` : `block`)};
  ${(props) =>
    props.displayInline
      ? `
  display: inline;
  vertical-align: middle;`
      : `
  display: block;`}

  flex-shrink: 0;
  ${(props) => props.styledWidth && `width: ${props.styledWidth};`}
  ${(props) => props.styledHeight && `height: ${props.styledHeight};`}

  ${(props) => props.light && `fill: ${props.theme.textLight};`}
  ${(props) => props.dark && `fill: ${props.theme.textDark};`}

  // Until we sort out what "light / dark" means for components that have both
  // modes, use "realDark" to get real
  ${(props) => props.realDark && `fill: ${props.theme.dark};`}

  ${(props) => props.fillColor && `fill: ${props.fillColor};`}

  ${(props) => props.opacity && `opacity: ${props.opacity};`}
`;

export default Object.assign(Icon, { GLYPHS });
