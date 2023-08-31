import { Mesh, PBRMaterial, Scene, StandardMaterial, Vector3, VertexBuffer, VertexData } from "@babylonjs/core";
import { EntVector3 } from "../EntitySystem/CoreComponents";
import { defaultLayerMask } from "./LayerMasks";

export function GenerateOutlineMesh(original: Mesh, outlineWidth = 0.005) {
    const outline = GenerateScaledMesh(original, outlineWidth);
    outline.flipFaces(true);
    outline.isPickable = false;
    return outline;
}

export function GenerateScaledMesh(original: Mesh, scaleAmmt = 0.005) {
    const scaled = original.clone("Scaled_" + original.name);
    scaled.makeGeometryUnique();
    const positions = scaled.getVerticesData(VertexBuffer.PositionKind);
    const normals = scaled.getVerticesData(VertexBuffer.NormalKind);
    for (var i = 0; i < positions.length; i++) {
        positions[i] = positions[i] + normals[i] * scaleAmmt;
    }
    return scaled;
}

export function CreateMeshFromTriangles(triangles: EntVector3[][], scene: Scene, existingMesh: Mesh = undefined): Mesh {
    // Convert the triangles to positions and indices
    const positions: number[] = [];
    const indices: number[] = [];
    for (const triangle of triangles) {
        for (const vertex of triangle) {
            positions.push(vertex.X, vertex.Y, vertex.Z);
        }
    }
    for (let i = 0; i < triangles.length * 3; i++) {
        indices.push(i);
    }

    // Calculate the normals
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);

    // Create and apply vertex data
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;

    // Create the mesh and apply the vertex data
    if (existingMesh === undefined) {
        const mesh = new Mesh("generatedMesh", scene);
        vertexData.applyToMesh(mesh);
        mesh.material = new StandardMaterial("GenerateMat");
        mesh.material.backFaceCulling = false;
        mesh.layerMask = defaultLayerMask;
        return mesh;
    } else {
        vertexData.applyToMesh(existingMesh);
        existingMesh.isVisible = true;
        return existingMesh;
    }
}

export type ExtractedMeshData = {
    vertices: number[];
    triangles: number[];
};

/** Warning - since no normal information they can be inversed */
export function ExtractedMeshDataToMesh(data: ExtractedMeshData, scene: Scene) {
    var customMesh = new Mesh("custom", scene);

    var vertexData = new VertexData();

    // Now, you assign vertices and indices (triangles) to the vertexData
    vertexData.positions = data.vertices;
    vertexData.indices = data.triangles;

    // Apply vertex data to the custom mesh
    vertexData.applyToMesh(customMesh);

    return customMesh;
}

/** Ensures faces point upwards (for nav related items) */
export function ExtractedMeshDataToMeshUpNormals(data: ExtractedMeshData, scene: Scene) {
    var customMesh = new Mesh("custom", scene);

    var vertexData = new VertexData();

    // Now, you assign vertices and indices (triangles) to the vertexData
    vertexData.positions = data.vertices;
    vertexData.indices = data.triangles;

    // Ensure the normals array exists and is of the appropriate size
    vertexData.normals = new Array(vertexData.positions.length).fill(0);

    // Compute normals
    VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);

    // Bias the normals to point upwards
    const upwardVector = new Vector3(0, 1, 0);
    for (let i = 0; i < vertexData.normals.length; i += 3) {
        let normal = new Vector3(vertexData.normals[i], vertexData.normals[i + 1], vertexData.normals[i + 2]);
        normal.addInPlace(upwardVector);
        normal.normalize();

        vertexData.normals[i] = normal.x;
        vertexData.normals[i + 1] = normal.y;
        vertexData.normals[i + 2] = normal.z;
    }

    for (let i = 0; i < vertexData.indices.length; i += 3) {
        let temp = vertexData.indices[i];
        vertexData.indices[i] = vertexData.indices[i + 2];
        vertexData.indices[i + 2] = temp;
    }

    // Apply vertex data to the custom mesh
    vertexData.applyToMesh(customMesh);

    return customMesh;
}
