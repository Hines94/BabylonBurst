import { Component } from "./Component";
import { EntTransform, EntVector3, EntVector4 } from "./CoreComponents";
import { EntityData } from "./EntityData";
import { TrackedVariable } from "./TrackedVariable";
import { RegisteredType, Saved } from "./TypeRegister";


@RegisteredType(ParentedTransform,{RequiredComponents:[EntTransform],comment:"This component will move with the parent, but using its local offset"})
export class ParentedTransform extends Component {
    @TrackedVariable()
    @Saved(EntityData,{comment:"The parent of this transform"})
    parentEntity:EntityData;

    @TrackedVariable()
    @Saved(EntTransform,{comment:"The relative transform of this vs the parent"})
    childRelative = new EntTransform();

    onComponentChanged(): void {
        this.setInParentedChildren();
        this.recalculateThisTransform();
    }

    onComponentRemoved(): void {
        this.removeFromParentedChildren();
    }

    private removeFromParentedChildren() {
        if (this.parentEntity && this.parentEntity.IsValid()) {
            const ownerTransform = this.parentEntity.GetComponent(EntTransform);
            if (ownerTransform.children.includes(this.entityOwner)) {
                ownerTransform.children = ownerTransform.children.filter(c=>c!==this.entityOwner);
            }
        }
    }

    private setInParentedChildren() {
        if (this.parentEntity && this.parentEntity.IsValid()) {
            const ownerTransform = this.parentEntity.GetComponent(EntTransform);
            if (!ownerTransform.children.includes(this.entityOwner)) {
                ownerTransform.children.push(this.entityOwner);
            }
        }
    }

    recalculateThisTransform(bRecalculateParent = true) {
        if(!this.IsOwnerValid()) {
            return;
        }
        const transform = this.entityOwner.GetComponent(EntTransform);
        if(!transform) {
            return;
        }

        if(!this.parentEntity || !this.parentEntity.IsValid()) {
            transform.Position = this.childRelative.Position;
            transform.Rotation = this.childRelative.Rotation;
            transform.Scale = this.childRelative.Scale;
            return;
        }

        if(bRecalculateParent) {
            const parentParented = this.parentEntity.GetComponent(ParentedTransform);
            if(parentParented) {
                parentParented.recalculateThisTransform();
            }
        }

        const parentTransform = this.parentEntity.GetComponent(EntTransform);

        EntVector3.Copy(transform.Position,EntVector3.Add(parentTransform.Position,this.childRelative.Position));
        EntVector4.Copy(transform.Rotation,EntVector4.Multiply(parentTransform.Rotation, this.childRelative.Rotation));
        EntVector3.Copy(transform.Scale,EntVector3.Multiply(parentTransform.Scale, this.childRelative.Scale));
    }

    static GetRelativeTrasnsform(worldTransform:EntTransform,parentTransform:EntTransform) {
        const pos = EntVector3.Subtract(worldTransform.Position,parentTransform.Position);
        const invert = EntVector4.Inverse(worldTransform.Rotation);
        const rot = EntVector4.Multiply(parentTransform.Rotation,invert);
        const scale = EntVector3.Divide(worldTransform.Scale,parentTransform.Scale);

        const ret = new EntTransform();
        ret.Position = pos;
        ret.Rotation = rot;
        ret.Scale = scale;
        return ret;
    }
}