import { ISoundOptions } from "@babylonjs/core";
import { AudioClipInstance } from "../AsyncAssets";
import { AsyncAudioClipDefinition } from "../AsyncAssets/AsyncAudioClip";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { GameEcosystem } from "../GameEcosystem";

const audioLoaderSaveLoc = '___AUDIOLOADERS___';

@RegisteredType(AudioSpecifier)
export class AudioSpecifier {
    @TrackedVariable()
    @Saved(String)
    FilePath:string;

    @TrackedVariable()
    @Saved(String)
    FileName:string;

    getAudioClip(ecosystem:GameEcosystem, overwriteOptions: ISoundOptions = null) : AudioClipInstance {
        const thisName = '_' + this.FilePath + '_' + this.FileName + '_';
        if(!ecosystem.dynamicProperties[audioLoaderSaveLoc]) ecosystem.dynamicProperties[audioLoaderSaveLoc] = {};
        if(!ecosystem.dynamicProperties[audioLoaderSaveLoc][thisName]) ecosystem.dynamicProperties[audioLoaderSaveLoc][thisName] = new AsyncAudioClipDefinition(this.FilePath,this.FileName);
        return ecosystem.dynamicProperties[audioLoaderSaveLoc][thisName].GetSoundInstance(ecosystem.scene,overwriteOptions);
    }

    isEmptyAudioSpecifier() {
        if(this.FilePath === undefined || this.FilePath === null || this.FilePath === "") {
            return true;
        }
        if(this.FileName === undefined || this.FileName === null || this.FileName === "") {
            return true;
        }
        return false;
    }
}