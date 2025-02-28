/**GLTF v2 type definition
 * Generated using `gltf-typescript-generator` package (https://github.com/robertlong/gltf-typescript-generator)
 * License: The Unlicense license (public domain)
 * gltf-typescript-generator ./GLTF.d.ts https://raw.githubusercontent.com/KhronosGroup/glTF/master/specification/2.0/schema/glTF.schema.json
 */

export type GlTfId = number;
/**
 * An object pointing to a buffer view containing the indices of deviating accessor values. The number of indices is equal to `accessor.sparse.count`. Indices **MUST** strictly increase.
 */
export interface AccessorSparseIndices {
  /**
   * The index of the buffer view with sparse indices. The referenced buffer view **MUST NOT** have its `target` or `byteStride` properties defined. The buffer view and the optional `byteOffset` **MUST** be aligned to the `componentType` byte length.
   */
  bufferView: GlTfId;
  /**
   * The offset relative to the start of the buffer view in bytes.
   */
  byteOffset?: number;
  /**
   * The indices data type.
   */
  componentType: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An object pointing to a buffer view containing the deviating accessor values. The number of elements is equal to `accessor.sparse.count` times number of components. The elements have the same component type as the base accessor. The elements are tightly packed. Data **MUST** be aligned following the same rules as the base accessor.
 */
export interface AccessorSparseValues {
  /**
   * The index of the bufferView with sparse values. The referenced buffer view **MUST NOT** have its `target` or `byteStride` properties defined.
   */
  bufferView: GlTfId;
  /**
   * The offset relative to the start of the bufferView in bytes.
   */
  byteOffset?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Sparse storage of accessor values that deviate from their initialization value.
 */
export interface AccessorSparse {
  /**
   * Number of deviating accessor values stored in the sparse array.
   */
  count: number;
  /**
   * An object pointing to a buffer view containing the indices of deviating accessor values. The number of indices is equal to `count`. Indices **MUST** strictly increase.
   */
  indices: AccessorSparseIndices;
  /**
   * An object pointing to a buffer view containing the deviating accessor values.
   */
  values: AccessorSparseValues;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A typed view into a buffer view that contains raw binary data.
 */
export interface Accessor {
  /**
   * The index of the bufferView.
   */
  bufferView?: GlTfId;
  /**
   * The offset relative to the start of the buffer view in bytes.
   */
  byteOffset?: number;
  /**
   * The datatype of the accessor's components.
   */
  componentType: number;
  /**
   * Specifies whether integer data values are normalized before usage.
   */
  normalized?: boolean;
  /**
   * The number of elements referenced by this accessor.
   */
  count: number;
  /**
   * Specifies if the accessor's elements are scalars, vectors, or matrices.
   */
  type: any | string;
  /**
   * Maximum value of each component in this accessor.
   */
  max?: number[];
  /**
   * Minimum value of each component in this accessor.
   */
  min?: number[];
  /**
   * Sparse storage of elements that deviate from their initialization value.
   */
  sparse?: AccessorSparse;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The descriptor of the animated property.
 */
export interface AnimationChannelTarget {
  /**
   * The index of the node to animate. When undefined, the animated object **MAY** be defined by an extension.
   */
  node?: GlTfId;
  /**
   * The name of the node's TRS property to animate, or the `"weights"` of the Morph Targets it instantiates. For the `"translation"` property, the values that are provided by the sampler are the translation along the X, Y, and Z axes. For the `"rotation"` property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the `"scale"` property, the values are the scaling factors along the X, Y, and Z axes.
   */
  path: any | string;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An animation channel combines an animation sampler with a target property being animated.
 */
export interface AnimationChannel {
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   */
  sampler: GlTfId;
  /**
   * The descriptor of the animated property.
   */
  target: AnimationChannelTarget;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
 */
export interface AnimationSampler {
  /**
   * The index of an accessor containing keyframe timestamps.
   */
  input: GlTfId;
  /**
   * Interpolation algorithm.
   */
  interpolation?: any | string;
  /**
   * The index of an accessor, containing keyframe output values.
   */
  output: GlTfId;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A keyframe animation.
 */
export interface Animation {
  /**
   * An array of animation channels. An animation channel combines an animation sampler with a target property being animated. Different channels of the same animation **MUST NOT** have the same targets.
   */
  channels: AnimationChannel[];
  /**
   * An array of animation samplers. An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
   */
  samplers: AnimationSampler[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Metadata about the glTF asset.
 */
export interface Asset {
  /**
   * A copyright message suitable for display to credit the content creator.
   */
  copyright?: string;
  /**
   * Tool that generated this glTF model.  Useful for debugging.
   */
  generator?: string;
  /**
   * The glTF version in the form of `<major>.<minor>` that this asset targets.
   */
  version: string;
  /**
   * The minimum glTF version in the form of `<major>.<minor>` that this asset targets. This property **MUST NOT** be greater than the asset version.
   */
  minVersion?: string;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A buffer points to binary geometry, animation, or skins.
 */
export interface Buffer {
  /**
   * The URI (or IRI) of the buffer.
   */
  uri?: string;
  /**
   * The length of the buffer in bytes.
   */
  byteLength: number;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export interface BufferView {
  /**
   * The index of the buffer.
   */
  buffer: GlTfId;
  /**
   * The offset into the buffer in bytes.
   */
  byteOffset?: number;
  /**
   * The length of the bufferView in bytes.
   */
  byteLength: number;
  /**
   * The stride, in bytes.
   */
  byteStride?: number;
  /**
   * The hint representing the intended GPU buffer type to use with this buffer view.
   */
  target?: number;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export interface CameraOrthographic {
  /**
   * The floating-point horizontal magnification of the view. This value **MUST NOT** be equal to zero. This value **SHOULD NOT** be negative.
   */
  xmag: number;
  /**
   * The floating-point vertical magnification of the view. This value **MUST NOT** be equal to zero. This value **SHOULD NOT** be negative.
   */
  ymag: number;
  /**
   * The floating-point distance to the far clipping plane. This value **MUST NOT** be equal to zero. `zfar` **MUST** be greater than `znear`.
   */
  zfar: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export interface CameraPerspective {
  /**
   * The floating-point aspect ratio of the field of view.
   */
  aspectRatio?: number;
  /**
   * The floating-point vertical field of view in radians. This value **SHOULD** be less than π.
   */
  yfov: number;
  /**
   * The floating-point distance to the far clipping plane.
   */
  zfar?: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A camera's projection.  A node **MAY** reference a camera to apply a transform to place the camera in the scene.
 */
export interface Camera {
  /**
   * An orthographic camera containing properties to create an orthographic projection matrix. This property **MUST NOT** be defined when `perspective` is defined.
   */
  orthographic?: CameraOrthographic;
  /**
   * A perspective camera containing properties to create a perspective projection matrix. This property **MUST NOT** be defined when `orthographic` is defined.
   */
  perspective?: CameraPerspective;
  /**
   * Specifies if the camera uses a perspective or orthographic projection.
   */
  type: any | string;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Image data used to create a texture. Image **MAY** be referenced by an URI (or IRI) or a buffer view index.
 */
export interface Image {
  /**
   * The URI (or IRI) of the image.
   */
  uri?: string;
  /**
   * The image's media type. This field **MUST** be defined when `bufferView` is defined.
   */
  mimeType?: any | string;
  /**
   * The index of the bufferView that contains the image. This field **MUST NOT** be defined when `uri` is defined.
   */
  bufferView?: GlTfId;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Reference to a texture.
 */
export interface TextureInfo {
  /**
   * The index of the texture.
   */
  index: GlTfId;
  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   */
  texCoord?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export interface MaterialPbrMetallicRoughness {
  /**
   * The factors for the base color of the material.
   */
  baseColorFactor?: number[];
  /**
   * The base color texture.
   */
  baseColorTexture?: TextureInfo;
  /**
   * The factor for the metalness of the material.
   */
  metallicFactor?: number;
  /**
   * The factor for the roughness of the material.
   */
  roughnessFactor?: number;
  /**
   * The metallic-roughness texture.
   */
  metallicRoughnessTexture?: TextureInfo;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
export interface MaterialNormalTextureInfo {
  index?: any;
  texCoord?: any;
  /**
   * The scalar parameter applied to each normal vector of the normal texture.
   */
  scale?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
export interface MaterialOcclusionTextureInfo {
  index?: any;
  texCoord?: any;
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The material appearance of a primitive.
 */
export interface Material {
  name?: any;
  extensions?: any;
  extras?: any;
  /**
   * A set of parameter values that are used to define the metallic-roughness material model from Physically Based Rendering (PBR) methodology. When undefined, all the default values of `pbrMetallicRoughness` **MUST** apply.
   */
  pbrMetallicRoughness?: MaterialPbrMetallicRoughness;
  /**
   * The tangent space normal texture.
   */
  normalTexture?: MaterialNormalTextureInfo;
  /**
   * The occlusion texture.
   */
  occlusionTexture?: MaterialOcclusionTextureInfo;
  /**
   * The emissive texture.
   */
  emissiveTexture?: TextureInfo;
  /**
   * The factors for the emissive color of the material.
   */
  emissiveFactor?: number[];
  /**
   * The alpha rendering mode of the material.
   */
  alphaMode?: any | string;
  /**
   * The alpha cutoff value of the material.
   */
  alphaCutoff?: number;
  /**
   * Specifies whether the material is double sided.
   */
  doubleSided?: boolean;
  [k: string]: any;
}
/**
 * Geometry to be rendered with the given material.
 */
export interface MeshPrimitive {
  /**
   * A plain JSON object, where each key corresponds to a mesh attribute semantic and each value is the index of the accessor containing attribute's data.
   */
  attributes: {
    [k: string]: GlTfId;
  };
  /**
   * The index of the accessor that contains the vertex indices.
   */
  indices?: GlTfId;
  /**
   * The index of the material to apply to this primitive when rendering.
   */
  material?: GlTfId;
  /**
   * The topology type of primitives to render.
   */
  mode?: number;
  /**
   * An array of morph targets.
   */
  targets?: {
    [k: string]: GlTfId;
  }[];
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A set of primitives to be rendered.  Its global transform is defined by a node that references it.
 */
export interface Mesh {
  /**
   * An array of primitives, each defining geometry to be rendered.
   */
  primitives: MeshPrimitive[];
  /**
   * Array of weights to be applied to the morph targets. The number of array elements **MUST** match the number of morph targets.
   */
  weights?: number[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` **MUST** contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node **MAY** have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), `matrix` **MUST NOT** be present.
 */
export interface Node {
  /**
   * The index of the camera referenced by this node.
   */
  camera?: GlTfId;
  /**
   * The indices of this node's children.
   */
  children?: GlTfId[];
  /**
   * The index of the skin referenced by this node.
   */
  skin?: GlTfId;
  /**
   * A floating-point 4x4 transformation matrix stored in column-major order.
   */
  matrix?: number[];
  /**
   * The index of the mesh in this node.
   */
  mesh?: GlTfId;
  /**
   * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
   */
  rotation?: number[];
  /**
   * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
   */
  scale?: number[];
  /**
   * The node's translation along the x, y, and z axes.
   */
  translation?: number[];
  /**
   * The weights of the instantiated morph target. The number of array elements **MUST** match the number of morph targets of the referenced mesh. When defined, `mesh` **MUST** also be defined.
   */
  weights?: number[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export interface Sampler {
  /**
   * Magnification filter.
   */
  magFilter?: number;
  /**
   * Minification filter.
   */
  minFilter?: number;
  /**
   * S (U) wrapping mode.
   */
  wrapS?: number;
  /**
   * T (V) wrapping mode.
   */
  wrapT?: number;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The root nodes of a scene.
 */
export interface Scene {
  /**
   * The indices of each root node.
   */
  nodes?: GlTfId[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Joints and matrices defining a skin.
 */
export interface Skin {
  /**
   * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.
   */
  inverseBindMatrices?: GlTfId;
  /**
   * The index of the node used as a skeleton root.
   */
  skeleton?: GlTfId;
  /**
   * Indices of skeleton nodes, used as joints in this skin.
   */
  joints: GlTfId[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A texture and its sampler.
 */
export interface Texture {
  /**
   * The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering **SHOULD** be used.
   */
  sampler?: GlTfId;
  /**
   * The index of the image used by this texture. When undefined, an extension or other mechanism **SHOULD** supply an alternate texture source, otherwise behavior is undefined.
   */
  source?: GlTfId;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The root object for a glTF asset.
 */
export interface GlTf {
  /**
   * Names of glTF extensions used in this asset.
   */
  extensionsUsed?: string[];
  /**
   * Names of glTF extensions required to properly load this asset.
   */
  extensionsRequired?: string[];
  /**
   * An array of accessors.
   */
  accessors?: Accessor[];
  /**
   * An array of keyframe animations.
   */
  animations?: Animation[];
  /**
   * Metadata about the glTF asset.
   */
  asset: Asset;
  /**
   * An array of buffers.
   */
  buffers?: Buffer[];
  /**
   * An array of bufferViews.
   */
  bufferViews?: BufferView[];
  /**
   * An array of cameras.
   */
  cameras?: Camera[];
  /**
   * An array of images.
   */
  images?: Image[];
  /**
   * An array of materials.
   */
  materials?: Material[];
  /**
   * An array of meshes.
   */
  meshes?: Mesh[];
  /**
   * An array of nodes.
   */
  nodes?: Node[];
  /**
   * An array of samplers.
   */
  samplers?: Sampler[];
  /**
   * The index of the default scene.
   */
  scene?: GlTfId;
  /**
   * An array of scenes.
   */
  scenes?: Scene[];
  /**
   * An array of skins.
   */
  skins?: Skin[];
  /**
   * An array of textures.
   */
  textures?: Texture[];
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
