/** All possible assets that we can cache in the background */
var allAssetsToCache:BackgroundCacher[] = [];
/** The currently running background cache */
var currentCacheTask:Promise<any>;

const finishTask = (val:string)=>{
    currentCacheTask = undefined
};

/** Chug through our background assets and load one at a time */
export function UpdateBackgroundCache(){
    if(allAssetsToCache.length === 0){return;}  
    if(currentCacheTask === undefined){
        allAssetsToCache = allAssetsToCache.sort((a,b)=>{return a.backgroundCachePriority - b.backgroundCachePriority;});
        currentCacheTask = allAssetsToCache[0].GetBackgroundCacheTask().then(finishTask,finishTask);
        allAssetsToCache = allAssetsToCache.slice(1,allAssetsToCache.length);
    }  
}

/** A simple class that will provide an interface for our assets to cache in the background whilst the level is ongoing */
export abstract class BackgroundCacher
{
    /** Higher value means cached earlier */
    backgroundCachePriority = 0;

    constructor(){
        allAssetsToCache.push(this);
    }

    /** Run a task that will cache our assets in the background (could make method async for ease) */
    abstract GetBackgroundCacheTask():Promise<string>;
}