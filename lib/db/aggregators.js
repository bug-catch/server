// Aggregate all data from the events collection
const aggregateEvents = [
    {
        $group: {
            _id: "events",
            total: {
                $sum: 1,
            },
            total_errors: {
                $sum: {
                    $cond: [
                        {
                            $eq: ["$type", "error"],
                        },
                        1,
                        0,
                    ],
                },
            },
            total_custom: {
                $sum: {
                    $cond: [
                        {
                            $eq: ["$type", "error"],
                        },
                        0,
                        1,
                    ],
                },
            },
        },
    },
    {
        $project: {
            total: "$total",
            total_errors: "$total_errors",
            total_custom: "$total_custom",
        },
    },
];

// Aggregate all data from the web-vitals collection
// Gets the average, maximum, and minimim for each value + percentages for booleans
const aggregateWebVitals = [
    {
        $group: {
            _id: "insights",
            total: {
                $sum: 1,
            },

            // Device Memory
            deviceMemory_avg: {
                $avg: "$data.navigatorInformation.deviceMemory",
            },
            deviceMemory_max: {
                $max: "$data.navigatorInformation.deviceMemory",
            },
            deviceMemory_min: {
                $min: "$data.navigatorInformation.deviceMemory",
            },

            // Device CPU Cores
            deviceCPUCores_avg: {
                $avg: "$data.navigatorInformation.hardwareConcurrency",
            },
            deviceCPUCores_max: {
                $max: "$data.navigatorInformation.hardwareConcurrency",
            },
            deviceCPUCores_min: {
                $min: "$data.navigatorInformation.hardwareConcurrency",
            },

            // Service Worker Is Unsupported
            serviceWorker_unsupported: {
                $sum: {
                    $cond: [
                        {
                            $eq: [
                                "$data.navigatorInformation.serviceWorkerStatus",
                                "unsupported",
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },

            // Is Low End Device
            // Combination of the score of RAM and CPU
            isLowEndDevice_true: {
                $sum: {
                    $cmp: ["$data.navigatorInformation.isLowEndDevice", false],
                },
            },

            // Is Low End Experience
            // Combination of the score of RAM, CPU, NetworkStatus and SaveData
            isLowEndExperience_true: {
                $sum: {
                    $cmp: [
                        "$data.navigatorInformation.isLowEndExperience",
                        false,
                    ],
                },
            },

            // Time Till First Byte
            ttfb_avg: {
                $avg: "$data.ttfb",
            },
            ttfb_max: {
                $max: "$data.ttfb",
            },
            ttfb_min: {
                $min: "$data.ttfb",
            },

            // First Paint
            fp_avg: {
                $avg: "$data.fp",
            },
            fp_max: {
                $max: "$data.fp",
            },
            fp_min: {
                $min: "$data.fp",
            },

            // First Contentful Paint
            fcp_avg: {
                $avg: "$data.fcp",
            },
            fcp_max: {
                $max: "$data.fcp",
            },
            fcp_min: {
                $min: "$data.fcp",
            },

            // First Input Delay
            fid_avg: {
                $avg: "$data.fid",
            },
            fid_max: {
                $max: "$data.fid",
            },
            fid_min: {
                $min: "$data.fid",
            },

            // Largest Contentful Paint
            lcp_avg: {
                $avg: "$data.lcp",
            },
            lcp_max: {
                $max: "$data.lcp",
            },
            lcp_min: {
                $min: "$data.lcp",
            },

            // Cumulative Layout Shift
            cls_avg: {
                $avg: "$data.cls",
            },
            cls_max: {
                $max: "$data.cls",
            },
            cls_min: {
                $min: "$data.cls",
            },

            // Total Blocking Time
            tbt_avg: {
                $avg: "$data.tbt",
            },
            tbt_max: {
                $max: "$data.tbt",
            },
            tbt_min: {
                $min: "$data.tbt",
            },

            // Device type
            // * Desktop
            // * Mobile
            // * Tablet
            // * Other
            device_desktop: {
                $sum: {
                    $cond: [
                        {
                            $eq: ["$device.browser.device", "desktop"],
                        },
                        1,
                        0,
                    ],
                },
            },
            device_mobile: {
                $sum: {
                    $cond: [
                        {
                            $eq: ["$device.browser.device", "mobile"],
                        },
                        1,
                        0,
                    ],
                },
            },
            device_tablet: {
                $sum: {
                    $cond: [
                        {
                            $eq: ["$device.browser.device", "tablet"],
                        },
                        1,
                        0,
                    ],
                },
            },
            device_known: {
                $sum: {
                    $cond: [
                        {
                            $or: [
                                {
                                    $eq: ["$device.browser.device", "desktop"],
                                },
                                {
                                    $eq: ["$device.browser.device", "mobile"],
                                },
                                {
                                    $eq: ["$device.browser.device", "tablet"],
                                },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
        },
    },
    {
        $project: {
            count: "$total",
            device: {
                device: {
                    desktop: "$device_desktop",
                    mobile: "$device_mobile",
                    tablet: "$device_tablet",
                    other: { $subtract: ["$total", "$device_known"] },
                    desktopPercent: {
                        $multiply: [
                            {
                                $divide: ["$device_desktop", "$total"],
                            },
                            100,
                        ],
                    },
                    mobilePercent: {
                        $multiply: [
                            {
                                $divide: ["$device_mobile", "$total"],
                            },
                            100,
                        ],
                    },
                    tabletPercent: {
                        $multiply: [
                            {
                                $divide: ["$device_tablet", "$total"],
                            },
                            100,
                        ],
                    },
                    otherPercent: {
                        $multiply: [
                            {
                                $divide: [
                                    {
                                        $subtract: ["$total", "$device_known"],
                                    },
                                    "$total",
                                ],
                            },
                            100,
                        ],
                    },
                },
                cpuCores: {
                    avg: "$deviceCPUCores_avg",
                    max: "$deviceCPUCores_max",
                    min: "$deviceCPUCores_min",
                },
                memory: {
                    avg: "$deviceMemory_avg",
                    max: "$deviceMemory_max",
                    min: "$deviceMemory_min",
                },
                serviceWorkerUnsupportedPercent: {
                    $multiply: [
                        { $divide: ["$serviceWorker_unsupported", "$total"] },
                        100,
                    ],
                },
                lowEndDevicesPercent: {
                    $multiply: [
                        {
                            $divide: ["$isLowEndDevice_true", "$total"],
                        },
                        100,
                    ],
                },
                lowEndExperiencesPercent: {
                    $multiply: [
                        {
                            $divide: ["$isLowEndExperience_true", "$total"],
                        },
                        100,
                    ],
                },
            },
            ttfb: {
                avg: "$ttfb_avg",
                max: "$ttfb_max",
                min: "$ttfb_min",
            },
            fp: {
                avg: "$fp_avg",
                max: "$fp_max",
                min: "$fp_min",
            },
            fcp: {
                avg: "$fcp_avg",
                max: "$fcp_max",
                min: "$fcp_min",
            },
            fid: {
                avg: "$fid_avg",
                max: "$fid_max",
                min: "$fid_min",
            },
            lcp: {
                avg: "$lcp_avg",
                max: "$lcp_max",
                min: "$lcp_min",
            },
            cls: {
                avg: "$cls_avg",
                max: "$cls_max",
                min: "$cls_min",
            },
            tbt: {
                avg: "$tbt_avg",
                max: "$tbt_max",
                min: "$tbt_min",
            },
        },
    },
];

module.exports = {
    aggregateWebVitals,
    aggregateEvents,
};
