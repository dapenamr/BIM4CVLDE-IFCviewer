import * as OBC from "openbim-components"
import * as THREE from "three"

const viewer = new OBC.Components()
viewer.onInitialized.add(() => {})

const sceneComponent = new OBC.SimpleScene(viewer)
sceneComponent.setup()
viewer.scene = sceneComponent

const viewerContainer = document.getElementById(
  "bim4cvlde-sharepoint-ifcviewer"
) as HTMLDivElement;
const rendererComponent = new OBC.PostproductionRenderer(
  viewer, 
  viewerContainer
);
viewer.renderer = rendererComponent
const postproduction = rendererComponent.postproduction

const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer)
viewer.camera = cameraComponent

const raycasterComponent = new OBC.SimpleRaycaster(viewer)
viewer.raycaster = raycasterComponent

viewer.init()
postproduction.enabled = true

const grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666))
postproduction.customEffects.excludedMeshes.push(grid.get())

const ifcLoader = new OBC.FragmentIfcLoader(viewer)

ifcLoader.settings.wasm = {
  absolute: true,
  path: "https://unpkg.com/web-ifc@0.0.44/",
};

const highlighter = new OBC.FragmentHighlighter(viewer)
highlighter.setup()

const propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer)
highlighter.events.select.onClear.add(() => {
  propertiesProcessor.cleanPropertiesList()
})

ifcLoader.onIfcLoaded.add(async model => {
  propertiesProcessor.process(model)
  highlighter.events.select.onHighlight.add((selection) => {
    const fragmentID = Object.keys(selection)[0]
    const expressID = Number([...selection[fragmentID]][0])
    propertiesProcessor.renderProperties(model, expressID)
  })
  highlighter.update()
})

const mainToolbar = new OBC.Toolbar(viewer)
mainToolbar.addChild(
  ifcLoader.uiElement.get("main"),
  propertiesProcessor.uiElement.get("main")
)

const filterButton = new OBC.Button(viewer);
filterButton.materialIcon = "filter_alt";
filterButton.tooltip = "Filter an Element";
mainToolbar.addChild(filterButton);
filterButton.onClick.add(() => {
  alert('test');
})

viewer.ui.addToolbar(mainToolbar);

window.addEventListener("BIM4CVLDE-IFCviewer", async (event: any) => {
  const { name, payload } = event.detail;
  if (name === "openModel") {
    const { name, buffer } = payload;
    const model = await ifcLoader.load(buffer, name);
    const scene = viewer.scene.get();
    scene.add(model);
  }
});