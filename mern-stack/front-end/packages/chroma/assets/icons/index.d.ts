/**
 * Shared Assets Export
 * Central location for all icons, images, and design assets
 * Used across all Canopy applications
 *
 * All icons are served as absolute URLs from the design system package
 * via the showcase app's asset serving route:
 * /packages/components/assets/[...path]/route.ts
 */
declare const ASSET_PATHS_RELATIVE: {
    icons: {
        add: string;
        addReaction: string;
        aiIcon: string;
        back: string;
        codeQuality: string;
        connect: string;
        dashboard: string;
        download: string;
        github: string;
        link: string;
        newLeads: string;
        settings: string;
        tag: string;
        thumbUp: string;
        turingDoc: string;
        turingSync: string;
        vault: string;
        ai: string;
        apps: string;
        arrowUp: string;
        calendar: string;
        chatButton: string;
        clone: string;
        close: string;
        collapseMenu: string;
        custom: string;
        dev: string;
        devFilled: string;
        document: string;
        dropDown: string;
        edit: string;
        estimation: string;
        estimationFilled: string;
        eyeOff: string;
        eyeOn: string;
        filter: string;
        firm: string;
        gptCollapse: string;
        gptActive: string;
        gridView: string;
        insights: string;
        like: string;
        linkOff: string;
        listView: string;
        module: string;
        more: string;
        nextIdea: string;
        notification: string;
        peers: string;
        prebuilt: string;
        priceTag: string;
        pricing: string;
        pricingFilled: string;
        questionMark: string;
        reply: string;
        search: string;
        sort: string;
        sprk: string;
        studio: string;
        studioFilled: string;
        summarizeFilled: string;
        summarizeNormal: string;
        templateActive: string;
        templateNormal: string;
        tickFilled: string;
    };
    status: {
        inProgress: string;
        notQualified: string;
        readyToSubmit: string;
        submitted: string;
        statusChange: string;
    };
    illustrations: {
        profileEmpty: string;
        profileEmpty1: string;
        uiListing: string;
        setup: string;
    };
};
export declare const getAssetPath: (category: keyof typeof ASSET_PATHS_RELATIVE, key: string) => string;
export declare const ICONS: {
    add: string;
    addReaction: string;
    aiIcon: string;
    back: string;
    codeQuality: string;
    connect: string;
    dashboard: string;
    download: string;
    github: string;
    link: string;
    newLeads: string;
    settings: string;
    tag: string;
    thumbUp: string;
    turingDoc: string;
    turingSync: string;
    vault: string;
    ai: string;
    apps: string;
    arrowUp: string;
    calendar: string;
    chatButton: string;
    clone: string;
    close: string;
    collapseMenu: string;
    custom: string;
    dev: string;
    devFilled: string;
    document: string;
    dropDown: string;
    edit: string;
    estimation: string;
    estimationFilled: string;
    eyeOff: string;
    eyeOn: string;
    filter: string;
    firm: string;
    gptCollapse: string;
    gptActive: string;
    gridView: string;
    insights: string;
    like: string;
    linkOff: string;
    listView: string;
    module: string;
    more: string;
    nextIdea: string;
    notification: string;
    peers: string;
    prebuilt: string;
    priceTag: string;
    pricing: string;
    pricingFilled: string;
    questionMark: string;
    reply: string;
    search: string;
    sort: string;
    sprk: string;
    studio: string;
    studioFilled: string;
    summarizeFilled: string;
    summarizeNormal: string;
    templateActive: string;
    templateNormal: string;
    tickFilled: string;
};
export declare const STATUS_ICONS: {
    inProgress: string;
    notQualified: string;
    readyToSubmit: string;
    submitted: string;
    statusChange: string;
};
export declare const ILLUSTRATIONS: {
    profileEmpty: string;
    profileEmpty1: string;
    uiListing: string;
    setup: string;
};
export {};
//# sourceMappingURL=index.d.ts.map