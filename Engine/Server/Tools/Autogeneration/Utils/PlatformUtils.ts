
export function RemovePlatformSpecificIncludePath(path:string) : string {
    //Just in case directly in folder (will not have /)
    if(path == "Common" || path == "ServerSpecific" || path == "WASMSpecific") {
        return "";
    }
    return path.replace("Common/", "").replace("ServerSpecific/","").replace("WASMSpecific/","");
}