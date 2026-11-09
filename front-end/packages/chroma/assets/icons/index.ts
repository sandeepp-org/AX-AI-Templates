/**
 * Shared Assets Export
 * Central location for all icons, images, and design assets
 * Used across all Canopy applications
 * 
 * All icons are served as absolute URLs from the design system package
 * via the showcase app's asset serving route:
 * /packages/components/assets/[...path]/route.ts
 */

// Base path for all design system assets
const DESIGN_SYSTEM_ASSET_BASE = '/packages/components/assets';

// Asset paths for direct usage - relative paths
const ASSET_PATHS_RELATIVE = {
  icons: {
    add: 'icons/add.svg',
    addReaction: 'icons/Add_reaction.svg',
    aiIcon: 'icons/Ai Icon.svg',
    back: 'icons/Back.svg',
    codeQuality: 'icons/Code Quality.svg',
    connect: 'icons/Connect.svg',
    dashboard: 'icons/Dashboard.svg',
    download: 'icons/Download.svg',
    github: 'icons/Github.svg',
    link: 'icons/Link.svg',
    newLeads: 'icons/New Leads.svg',
    settings: 'icons/Settings.svg',
    tag: 'icons/Tag.svg',
    thumbUp: 'icons/Thumb_up.svg',
    turingDoc: 'icons/Turing Doc.svg',
    turingSync: 'icons/Turing Sync.svg',
    vault: 'icons/Vault.svg',
    ai: 'icons/ai.svg',
    apps: 'icons/apps.svg',
    arrowUp: 'icons/arrow_up.svg',
    calendar: 'icons/calendar.svg',
    chatButton: 'icons/chat button.svg',
    clone: 'icons/clone.svg',
    close: 'icons/close.svg',
    collapseMenu: 'icons/collapse_menu.svg',
    custom: 'icons/custom.svg',
    dev: 'icons/dev.svg',
    devFilled: 'icons/dev_filled.svg',
    document: 'icons/document.svg',
    dropDown: 'icons/drop down.svg',
    edit: 'icons/edit.svg',
    estimation: 'icons/estimation.svg',
    estimationFilled: 'icons/estimation_filled.svg',
    eyeOff: 'icons/eye_off.svg',
    eyeOn: 'icons/eye_on.svg',
    filter: 'icons/filter.svg',
    firm: 'icons/firm.svg',
    gptCollapse: 'icons/gpt collapse.svg',
    gptActive: 'icons/gpt_active.svg',
    gridView: 'icons/grid_view.svg',
    insights: 'icons/insights.svg',
    like: 'icons/like.svg',
    linkOff: 'icons/link off.svg',
    listView: 'icons/list_view.svg',
    module: 'icons/module 1.svg',
    more: 'icons/more.svg',
    nextIdea: 'icons/next idea.svg',
    notification: 'icons/notification.svg',
    peers: 'icons/peers.svg',
    prebuilt: 'icons/prebuilt.svg',
    priceTag: 'icons/price tag.svg',
    pricing: 'icons/pricing.svg',
    pricingFilled: 'icons/Pricing_filled.svg',
    questionMark: 'icons/question_mark.svg',
    reply: 'icons/reply.svg',
    search: 'icons/search.svg',
    sort: 'icons/sort.svg',
    sprk: 'icons/sprk.svg',
    studio: 'icons/studio.svg',
    studioFilled: 'icons/studio_filled.svg',
    summarizeFilled: 'icons/summarize_filled.svg',
    summarizeNormal: 'icons/summarize_normal.svg',
    templateActive: 'icons/template_active.svg',
    templateNormal: 'icons/template_normal.svg',
    tickFilled: 'icons/tick filled.svg',
  },
  status: {
    inProgress: 'status/In-Progress.svg',
    notQualified: 'status/Not Qualified.svg',
    readyToSubmit: 'status/Ready To Submit.svg',
    submitted: 'status/Submitted.svg',
    statusChange: 'status/Status Change.svg',
  },
  illustrations: {
    profileEmpty: 'illustrations/Profile Empty.svg',
    profileEmpty1: 'illustrations/Profile Empty-1.svg',
    uiListing: 'illustrations/UI Listing.svg',
    setup: 'illustrations/Setup.svg',
  },
}

// Utility function to get asset path with absolute URL
export const getAssetPath = (category: keyof typeof ASSET_PATHS_RELATIVE, key: string): string => {
  const categoryAssets = ASSET_PATHS_RELATIVE[category] as Record<string, string>
  const relativePath = categoryAssets?.[key]
  
  if (!relativePath) {
    return ''
  }
  
  // Construct absolute URL for the asset
  return `${DESIGN_SYSTEM_ASSET_BASE}/${relativePath}`
}

// Export absolute URL constants for each icon
export const ICONS = {
  add: getAssetPath('icons', 'add'),
  addReaction: getAssetPath('icons', 'addReaction'),
  aiIcon: getAssetPath('icons', 'aiIcon'),
  back: getAssetPath('icons', 'back'),
  codeQuality: getAssetPath('icons', 'codeQuality'),
  connect: getAssetPath('icons', 'connect'),
  dashboard: getAssetPath('icons', 'dashboard'),
  download: getAssetPath('icons', 'download'),
  github: getAssetPath('icons', 'github'),
  link: getAssetPath('icons', 'link'),
  newLeads: getAssetPath('icons', 'newLeads'),
  settings: getAssetPath('icons', 'settings'),
  tag: getAssetPath('icons', 'tag'),
  thumbUp: getAssetPath('icons', 'thumbUp'),
  turingDoc: getAssetPath('icons', 'turingDoc'),
  turingSync: getAssetPath('icons', 'turingSync'),
  vault: getAssetPath('icons', 'vault'),
  ai: getAssetPath('icons', 'ai'),
  apps: getAssetPath('icons', 'apps'),
  arrowUp: getAssetPath('icons', 'arrowUp'),
  calendar: getAssetPath('icons', 'calendar'),
  chatButton: getAssetPath('icons', 'chatButton'),
  clone: getAssetPath('icons', 'clone'),
  close: getAssetPath('icons', 'close'),
  collapseMenu: getAssetPath('icons', 'collapseMenu'),
  custom: getAssetPath('icons', 'custom'),
  dev: getAssetPath('icons', 'dev'),
  devFilled: getAssetPath('icons', 'devFilled'),
  document: getAssetPath('icons', 'document'),
  dropDown: getAssetPath('icons', 'dropDown'),
  edit: getAssetPath('icons', 'edit'),
  estimation: getAssetPath('icons', 'estimation'),
  estimationFilled: getAssetPath('icons', 'estimationFilled'),
  eyeOff: getAssetPath('icons', 'eyeOff'),
  eyeOn: getAssetPath('icons', 'eyeOn'),
  filter: getAssetPath('icons', 'filter'),
  firm: getAssetPath('icons', 'firm'),
  gptCollapse: getAssetPath('icons', 'gptCollapse'),
  gptActive: getAssetPath('icons', 'gptActive'),
  gridView: getAssetPath('icons', 'gridView'),
  insights: getAssetPath('icons', 'insights'),
  like: getAssetPath('icons', 'like'),
  linkOff: getAssetPath('icons', 'linkOff'),
  listView: getAssetPath('icons', 'listView'),
  module: getAssetPath('icons', 'module'),
  more: getAssetPath('icons', 'more'),
  nextIdea: getAssetPath('icons', 'nextIdea'),
  notification: getAssetPath('icons', 'notification'),
  peers: getAssetPath('icons', 'peers'),
  prebuilt: getAssetPath('icons', 'prebuilt'),
  priceTag: getAssetPath('icons', 'priceTag'),
  pricing: getAssetPath('icons', 'pricing'),
  pricingFilled: getAssetPath('icons', 'pricingFilled'),
  questionMark: getAssetPath('icons', 'questionMark'),
  reply: getAssetPath('icons', 'reply'),
  search: getAssetPath('icons', 'search'),
  sort: getAssetPath('icons', 'sort'),
  sprk: getAssetPath('icons', 'sprk'),
  studio: getAssetPath('icons', 'studio'),
  studioFilled: getAssetPath('icons', 'studioFilled'),
  summarizeFilled: getAssetPath('icons', 'summarizeFilled'),
  summarizeNormal: getAssetPath('icons', 'summarizeNormal'),
  templateActive: getAssetPath('icons', 'templateActive'),
  templateNormal: getAssetPath('icons', 'templateNormal'),
  tickFilled: getAssetPath('icons', 'tickFilled'),
}

// Export status icons
export const STATUS_ICONS = {
  inProgress: getAssetPath('status', 'inProgress'),
  notQualified: getAssetPath('status', 'notQualified'),
  readyToSubmit: getAssetPath('status', 'readyToSubmit'),
  submitted: getAssetPath('status', 'submitted'),
  statusChange: getAssetPath('status', 'statusChange'),
}

// Export illustrations
export const ILLUSTRATIONS = {
  profileEmpty: getAssetPath('illustrations', 'profileEmpty'),
  profileEmpty1: getAssetPath('illustrations', 'profileEmpty1'),
  uiListing: getAssetPath('illustrations', 'uiListing'),
  setup: getAssetPath('illustrations', 'setup'),
}
