// Metro resolves image requires to an asset id (and picks @2x/@3x by screen density).
declare module "*.png" {
  const asset: number;
  export default asset;
}
