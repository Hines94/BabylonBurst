import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";


@RegisteredType(ModelSpecifier)
export class ModelSpecifier {
    @TrackedVariable()
    @Saved(String)
    FilePath:string;

    @TrackedVariable()
    @Saved(String)
    FileName:string;
    
    @TrackedVariable()
    @Saved(String)
    MeshName:string;


    isEmptyModelSpecifier() {
        if(this.FilePath === undefined || this.FilePath === null || this.FilePath === "") {
            return true;
        }
        if(this.FileName === undefined || this.FileName === null || this.FileName === "") {
            return true;
        }
        if(this.MeshName === undefined || this.MeshName === null || this.MeshName === "") {
            return true;
        }
        return false;
    }
}