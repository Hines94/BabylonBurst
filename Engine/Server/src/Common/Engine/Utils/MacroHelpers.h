//This is horrible with up to 100 "ForEach" style but it means we can stay in c++ without having to use autogeneration which can be useful! (eg for templates)

#define COUNT_ARGS(...) EXPAND(ARG_COUNT_PRIVATE(0, ##__VA_ARGS__, 100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0))

#define EXPAND(x) x

#define APPLY(MACRO, ...) \
    EXPAND(FOR_EACH(MACRO, __VA_ARGS__))

#define ARG_COUNT_PRIVATE(                            \
    _0, _1, _2, _3, _4, _5, _6, _7, _8, _9,           \
    _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, \
    _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, \
    _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, \
    _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, \
    _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, \
    _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, \
    _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, \
    _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, \
    _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, \
    _100, N, ...) N

#define GET_MACRO(                                    \
    _1, _2, _3, _4, _5, _6, _7, _8, _9,               \
    _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, \
    _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, \
    _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, \
    _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, \
    _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, \
    _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, \
    _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, \
    _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, \
    _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, \
    _100, NAME, ...) NAME

#define FOR_EACH(action, ...)                                                                                                                 \
    EXPAND(GET_MACRO(__VA_ARGS__,                                                                                                             \
                     FOR_EACH_100, FOR_EACH_99, FOR_EACH_98, FOR_EACH_97, FOR_EACH_96, FOR_EACH_95, FOR_EACH_94, FOR_EACH_93, FOR_EACH_92,    \
                     FOR_EACH_91, FOR_EACH_90, FOR_EACH_89, FOR_EACH_88, FOR_EACH_87, FOR_EACH_86, FOR_EACH_85, FOR_EACH_84, FOR_EACH_83,     \
                     FOR_EACH_82, FOR_EACH_81, FOR_EACH_80, FOR_EACH_79, FOR_EACH_78, FOR_EACH_77, FOR_EACH_76, FOR_EACH_75, FOR_EACH_74,     \
                     FOR_EACH_73, FOR_EACH_72, FOR_EACH_71, FOR_EACH_70, FOR_EACH_69, FOR_EACH_68, FOR_EACH_67, FOR_EACH_66, FOR_EACH_65,     \
                     FOR_EACH_64, FOR_EACH_63, FOR_EACH_62, FOR_EACH_61, FOR_EACH_60, FOR_EACH_59, FOR_EACH_58, FOR_EACH_57, FOR_EACH_56,     \
                     FOR_EACH_55, FOR_EACH_54, FOR_EACH_53, FOR_EACH_52, FOR_EACH_51, FOR_EACH_50, FOR_EACH_49, FOR_EACH_48, FOR_EACH_47,     \
                     FOR_EACH_46, FOR_EACH_45, FOR_EACH_44, FOR_EACH_43, FOR_EACH_42, FOR_EACH_41, FOR_EACH_40, FOR_EACH_39, FOR_EACH_38,     \
                     FOR_EACH_37, FOR_EACH_36, FOR_EACH_35, FOR_EACH_34, FOR_EACH_33, FOR_EACH_32, FOR_EACH_31, FOR_EACH_30, FOR_EACH_29,     \
                     FOR_EACH_28, FOR_EACH_27, FOR_EACH_26, FOR_EACH_25, FOR_EACH_24, FOR_EACH_23, FOR_EACH_22, FOR_EACH_21, FOR_EACH_20,     \
                     FOR_EACH_19, FOR_EACH_18, FOR_EACH_17, FOR_EACH_16, FOR_EACH_15, FOR_EACH_14, FOR_EACH_13, FOR_EACH_12, FOR_EACH_11,     \
                     FOR_EACH_10, FOR_EACH_9, FOR_EACH_8, FOR_EACH_7, FOR_EACH_6, FOR_EACH_5, FOR_EACH_4, FOR_EACH_3, FOR_EACH_2, FOR_EACH_1, \
                     FOR_EACH_0)(action, __VA_ARGS__))

/* 
Generate all macros:
https://playcode.io/typescript

function generateMacro(n: number): string {
    if (n < 1 || n > 100) {
        throw new Error("The number should be between 1 and 100.");
    }

    const macroName = `FOR_EACH_${n}`;

    // Generate list of arguments
    let args = Array.from({ length: n }, (_, i) => `_${i + 1}`);
    
    // Split the arguments into groups of 10 and join them
    const groupedArgs = args.reduce((acc, cur, idx) => {
        const groupIndex = Math.floor(idx / 10);
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
    }, []).map(group => group.join(',')).join(', \\\n                     ');

    // Generate the action sequence
    let actions = Array.from({ length: n }, (_, i) => `action(_${i + 1})`);

    // Split the actions into groups of 10 and join them
    const groupedActions = actions.reduce((acc, cur, idx) => {
        const groupIndex = Math.floor(idx / 10);
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
    }, []).map(group => group.join(' ')).join(' \\\n    ');

    return `#define ${macroName}(action,${groupedArgs}) \\\n    ${groupedActions}`;
}

for(var i = 100; i > 0; i--) {
  console.log(generateMacro(i))

}
*/

#define FOR_EACH_100(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                       \
                     _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                      \
                     _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                      \
                     _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                      \
                     _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                      \
                     _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                      \
                     _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                      \
                     _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                      \
                     _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                      \
                     _91, _92, _93, _94, _95, _96, _97, _98, _99, _100)                                                                                     \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93) action(_94) action(_95) action(_96) action(_97) action(_98) action(_99) action(_100)
#define FOR_EACH_99(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92, _93, _94, _95, _96, _97, _98, _99)                                                                                            \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93) action(_94) action(_95) action(_96) action(_97) action(_98) action(_99)
#define FOR_EACH_98(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92, _93, _94, _95, _96, _97, _98)                                                                                                 \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93) action(_94) action(_95) action(_96) action(_97) action(_98)
#define FOR_EACH_97(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92, _93, _94, _95, _96, _97)                                                                                                      \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93) action(_94) action(_95) action(_96) action(_97)
#define FOR_EACH_96(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92, _93, _94, _95, _96)                                                                                                           \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93) action(_94) action(_95) action(_96)
#define FOR_EACH_95(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92, _93, _94, _95)                                                                                                                \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93) action(_94) action(_95)
#define FOR_EACH_94(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92, _93, _94)                                                                                                                     \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93) action(_94)
#define FOR_EACH_93(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92, _93)                                                                                                                          \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92) action(_93)
#define FOR_EACH_92(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91, _92)                                                                                                                               \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91) action(_92)
#define FOR_EACH_91(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                       \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                       \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                       \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90,                                                                                       \
                    _91)                                                                                                                                    \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)                 \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)             \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)         \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)     \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90) \
                                        action(_91)
#define FOR_EACH_90(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89, _90)                                                                                   \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89) action(_90)
#define FOR_EACH_89(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83, _84, _85, _86, _87, _88, _89)                                                                                        \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88) action(_89)
#define FOR_EACH_88(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83, _84, _85, _86, _87, _88)                                                                                             \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87) action(_88)
#define FOR_EACH_87(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83, _84, _85, _86, _87)                                                                                                  \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86) action(_87)
#define FOR_EACH_86(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83, _84, _85, _86)                                                                                                       \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83) action(_84) action(_85) action(_86)
#define FOR_EACH_85(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83, _84, _85)                                                                                                            \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83) action(_84) action(_85)
#define FOR_EACH_84(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83, _84)                                                                                                                 \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83) action(_84)
#define FOR_EACH_83(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82, _83)                                                                                                                      \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82) action(_83)
#define FOR_EACH_82(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81, _82)                                                                                                                           \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81) action(_82)
#define FOR_EACH_81(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                                   \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                                   \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                                   \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80,                                                                                   \
                    _81)                                                                                                                                \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)                 \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)             \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)         \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)     \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80) \
                                    action(_81)
#define FOR_EACH_80(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79, _80)                                                                               \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79) action(_80)
#define FOR_EACH_79(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73, _74, _75, _76, _77, _78, _79)                                                                                    \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78) action(_79)
#define FOR_EACH_78(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73, _74, _75, _76, _77, _78)                                                                                         \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77) action(_78)
#define FOR_EACH_77(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73, _74, _75, _76, _77)                                                                                              \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76) action(_77)
#define FOR_EACH_76(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73, _74, _75, _76)                                                                                                   \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73) action(_74) action(_75) action(_76)
#define FOR_EACH_75(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73, _74, _75)                                                                                                        \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73) action(_74) action(_75)
#define FOR_EACH_74(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73, _74)                                                                                                             \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73) action(_74)
#define FOR_EACH_73(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72, _73)                                                                                                                  \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72) action(_73)
#define FOR_EACH_72(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71, _72)                                                                                                                       \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71) action(_72)
#define FOR_EACH_71(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                               \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                               \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                               \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70,                                                                               \
                    _71)                                                                                                                            \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)                 \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)             \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)         \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)     \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70) \
                                action(_71)
#define FOR_EACH_70(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69, _70)                                                                           \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69) action(_70)
#define FOR_EACH_69(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63, _64, _65, _66, _67, _68, _69)                                                                                \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68) action(_69)
#define FOR_EACH_68(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63, _64, _65, _66, _67, _68)                                                                                     \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67) action(_68)
#define FOR_EACH_67(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63, _64, _65, _66, _67)                                                                                          \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66) action(_67)
#define FOR_EACH_66(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63, _64, _65, _66)                                                                                               \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63) action(_64) action(_65) action(_66)
#define FOR_EACH_65(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63, _64, _65)                                                                                                    \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63) action(_64) action(_65)
#define FOR_EACH_64(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63, _64)                                                                                                         \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63) action(_64)
#define FOR_EACH_63(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62, _63)                                                                                                              \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62) action(_63)
#define FOR_EACH_62(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61, _62)                                                                                                                   \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61) action(_62)
#define FOR_EACH_61(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                           \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                           \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                           \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60,                                                                           \
                    _61)                                                                                                                        \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)                 \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)             \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)         \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)     \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60) \
                            action(_61)
#define FOR_EACH_60(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59, _60)                                                                       \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59) action(_60)
#define FOR_EACH_59(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58, _59)                                                                            \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58) action(_59)
#define FOR_EACH_58(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53, _54, _55, _56, _57, _58)                                                                                 \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57) action(_58)
#define FOR_EACH_57(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53, _54, _55, _56, _57)                                                                                      \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56) action(_57)
#define FOR_EACH_56(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53, _54, _55, _56)                                                                                           \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53) action(_54) action(_55) action(_56)
#define FOR_EACH_55(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53, _54, _55)                                                                                                \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53) action(_54) action(_55)
#define FOR_EACH_54(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53, _54)                                                                                                     \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53) action(_54)
#define FOR_EACH_53(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52, _53)                                                                                                          \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52) action(_53)
#define FOR_EACH_52(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51, _52)                                                                                                               \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51) action(_52)
#define FOR_EACH_51(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                        \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                       \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                       \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                       \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50,                                                                       \
                    _51)                                                                                                                    \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                          \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)             \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)         \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)     \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50) \
                        action(_51)
#define FOR_EACH_50(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49, _50)                                                                   \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49) action(_50)
#define FOR_EACH_49(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48, _49)                                                                        \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48) action(_49)
#define FOR_EACH_48(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43, _44, _45, _46, _47, _48)                                                                             \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47) action(_48)
#define FOR_EACH_47(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43, _44, _45, _46, _47)                                                                                  \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46) action(_47)
#define FOR_EACH_46(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43, _44, _45, _46)                                                                                       \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43) action(_44) action(_45) action(_46)
#define FOR_EACH_45(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43, _44, _45)                                                                                            \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43) action(_44) action(_45)
#define FOR_EACH_44(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43, _44)                                                                                                 \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43) action(_44)
#define FOR_EACH_43(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42, _43)                                                                                                      \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42) action(_43)
#define FOR_EACH_42(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41, _42)                                                                                                           \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41) action(_42)
#define FOR_EACH_41(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                    \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                                   \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                                   \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40,                                                                   \
                    _41)                                                                                                                \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                      \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)         \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)     \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40) \
                    action(_41)
#define FOR_EACH_40(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39, _40)                                                               \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39) action(_40)
#define FOR_EACH_39(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38, _39)                                                                    \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38) action(_39)
#define FOR_EACH_38(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33, _34, _35, _36, _37, _38)                                                                         \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37) action(_38)
#define FOR_EACH_37(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33, _34, _35, _36, _37)                                                                              \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36) action(_37)
#define FOR_EACH_36(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33, _34, _35, _36)                                                                                   \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33) action(_34) action(_35) action(_36)
#define FOR_EACH_35(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33, _34, _35)                                                                                        \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33) action(_34) action(_35)
#define FOR_EACH_34(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33, _34)                                                                                             \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33) action(_34)
#define FOR_EACH_33(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32, _33)                                                                                                  \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32) action(_33)
#define FOR_EACH_32(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31, _32)                                                                                                       \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31) action(_32)
#define FOR_EACH_31(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                                \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                               \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30,                                                               \
                    _31)                                                                                                            \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)                  \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)     \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30) \
                action(_31)
#define FOR_EACH_30(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29, _30)                                                           \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29) action(_30)
#define FOR_EACH_29(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28, _29)                                                                \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28) action(_29)
#define FOR_EACH_28(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23, _24, _25, _26, _27, _28)                                                                     \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27) action(_28)
#define FOR_EACH_27(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23, _24, _25, _26, _27)                                                                          \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26) action(_27)
#define FOR_EACH_26(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23, _24, _25, _26)                                                                               \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23) action(_24) action(_25) action(_26)
#define FOR_EACH_25(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23, _24, _25)                                                                                    \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23) action(_24) action(_25)
#define FOR_EACH_24(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23, _24)                                                                                         \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23) action(_24)
#define FOR_EACH_23(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22, _23)                                                                                              \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22) action(_23)
#define FOR_EACH_22(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21, _22)                                                                                                   \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21) action(_22)
#define FOR_EACH_21(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                                            \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20,                                                           \
                    _21)                                                                                                        \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)              \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20) \
            action(_21)
#define FOR_EACH_20(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19, _20)                                              \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19) action(_20)
#define FOR_EACH_19(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13, _14, _15, _16, _17, _18, _19)                                                   \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18) action(_19)
#define FOR_EACH_18(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13, _14, _15, _16, _17, _18)                                                        \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17) action(_18)
#define FOR_EACH_17(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13, _14, _15, _16, _17)                                                             \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16) action(_17)
#define FOR_EACH_16(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13, _14, _15, _16)                                                                  \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13) action(_14) action(_15) action(_16)
#define FOR_EACH_15(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13, _14, _15)                                                                       \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13) action(_14) action(_15)
#define FOR_EACH_14(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13, _14)                                                                            \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13) action(_14)
#define FOR_EACH_13(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12, _13)                                                                                 \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12) action(_13)
#define FOR_EACH_12(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11, _12)                                                                                      \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11) action(_12)
#define FOR_EACH_11(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10,                                               \
                    _11)                                                                                           \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10) \
        action(_11)
#define FOR_EACH_10(action, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10) \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9) action(_10)
#define FOR_EACH_9(action, _1, _2, _3, _4, _5, _6, _7, _8, _9) \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8) action(_9)
#define FOR_EACH_8(action, _1, _2, _3, _4, _5, _6, _7, _8) \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7) action(_8)
#define FOR_EACH_7(action, _1, _2, _3, _4, _5, _6, _7) \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6) action(_7)
#define FOR_EACH_6(action, _1, _2, _3, _4, _5, _6) \
    action(_1) action(_2) action(_3) action(_4) action(_5) action(_6)
#define FOR_EACH_5(action, _1, _2, _3, _4, _5) \
    action(_1) action(_2) action(_3) action(_4) action(_5)
#define FOR_EACH_4(action, _1, _2, _3, _4) \
    action(_1) action(_2) action(_3) action(_4)
#define FOR_EACH_3(action, _1, _2, _3) \
    action(_1) action(_2) action(_3)
#define FOR_EACH_2(action, _1, _2) \
    action(_1) action(_2)
#define FOR_EACH_1(action, _1) \
    action(_1)
