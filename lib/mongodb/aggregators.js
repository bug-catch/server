// Aggregate all data from the web-vitals collection
// Gets the average, maximum, and minimim for each value + percentages for booleans
const aggregateWebVitals = [
    {
        $group: {
            _id: "insights",
            total: {
                $sum: 1,
            },
            deviceMemory_avg: {
                $avg: "$data.navigatorInformation.deviceMemory",
            },
            deviceMemory_max: {
                $max: "$data.navigatorInformation.deviceMemory",
            },
            deviceMemory_min: {
                $min: "$data.navigatorInformation.deviceMemory",
            },
            deviceCPUCores_avg: {
                $avg: "$data.navigatorInformation.hardwareConcurrency",
            },
            deviceCPUCores_max: {
                $max: "$data.navigatorInformation.hardwareConcurrency",
            },
            deviceCPUCores_min: {
                $min: "$data.navigatorInformation.hardwareConcurrency",
            },
            isLowEndDevice_true: {
                $sum: {
                    $cmp: ["$data.navigatorInformation.isLowEndDevice", false],
                },
            },
            isLowEndExperience_true: {
                $sum: {
                    $cmp: [
                        "$data.navigatorInformation.isLowEndExperience",
                        false,
                    ],
                },
            },
            ttfb_avg: {
                $avg: "$data.ttfb",
            },
            ttfb_max: {
                $max: "$data.ttfb",
            },
            ttfb_min: {
                $min: "$data.ttfb",
            },
            fp_avg: {
                $avg: "$data.fp",
            },
            fp_max: {
                $max: "$data.fp",
            },
            fp_min: {
                $min: "$data.fp",
            },
            fcp_avg: {
                $avg: "$data.fcp",
            },
            fcp_max: {
                $max: "$data.fcp",
            },
            fcp_min: {
                $min: "$data.fcp",
            },
            fid_avg: {
                $avg: "$data.fid",
            },
            fid_max: {
                $max: "$data.fid",
            },
            fid_min: {
                $min: "$data.fid",
            },
            lcp_avg: {
                $avg: "$data.lcp",
            },
            lcp_max: {
                $max: "$data.lcp",
            },
            lcp_min: {
                $min: "$data.lcp",
            },
            cls_avg: {
                $avg: "$data.cls",
            },
            cls_max: {
                $max: "$data.cls",
            },
            cls_min: {
                $min: "$data.cls",
            },
            tbt_avg: {
                $avg: "$data.tbt",
            },
            tbt_max: {
                $max: "$data.tbt",
            },
            tbt_min: {
                $min: "$data.tbt",
            },
        },
    },
    {
        $project: {
            count: "$total",
            device: {
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
                lowEndDevices: {
                    $divide: ["$isLowEndDevice_true", "$total"],
                },
                lowEndExperiences: {
                    $divide: ["$isLowEndExperience_true", "$total"],
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
};
