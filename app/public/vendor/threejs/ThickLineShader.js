/**
 * ThickLineShader
 * @author Garcia Hurtado (ghurtado@gmail.com)
 *
 * This post filter emulates line thickness by applying a full screen pass to geometry
 * rendered in wireframe mode. It is meant to be applied to a scene containing only
 * "flat geometry" with edges being shown (ie: no textures or lighting);
 *
 * The idea / algorithm was inspired by the ThreeJS blur filters.
 *
 * The shader accepts an "edgeWidth" parameter, which determines the total number of
 * "passes", or copies of the textures which are all drawn 1px away from one another,
 * in both the vertical and horizontal axis. This creates the illusion of a solid
 * line of variable thickness.
 *
 * Parameters:
 *
 *	tDiffuse: Standard 2D texture sampler. Will automatically be set to your prefilter
 * 			full rendered scene by THREE.js
 *
 *	edgeWidth: Thickness of the resulting lines (in pixels)
 *
 *	diagOffset: When 0, the shader will do one fully horizontal copy and one fully vertical copy
 * 			of the scene for each pixel of the line width. Set to one to rotate the copies by 45 degrees
 *			This should help terminate the line caps nicely with diagonal fills.
 *
 *	totalWidth: Total width of the rendered scene (in pixels)
 *	totalHeight: Total height of the rendered scene (in pixels)
 *
 * --
 * Inspired by https://github.com/mrdoob/three.js/blob/master/examples/js/shaders/HorizontalBlurShader.js
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */
THREE.ThickLineShader = {
	
	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"edgeWidth": {type: "i", value: 1},
		"diagOffset": {type: "i", value: 0},
		"totalWidth": { type: "f", value: null },
		"totalHeight": { type: "f", value: null }
	},
	
	vertexShader: [
		"varying vec2 vUv;",
		
		"void main() {",
		"vUv = uv;",
		"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	
	].join("\n"),
	
	fragmentShader: [
		"uniform sampler2D tDiffuse;",
		"uniform int edgeWidth;",
		"uniform int diagOffset;",
		"uniform float totalWidth;",
		"uniform float totalHeight;",
		"const int MAX_LINE_WIDTH = 30;", // Needed due to weird limitations in GLSL around for loops
		"varying vec2 vUv;",
		
		"void main() {",
		"int offset = int( floor(float(edgeWidth) / float(2) + 0.5) );",
		"vec4 color = vec4( 0.0, 0.0, 0.0, 0.0);",
		
		// Horizontal copies of the wireframe first
		"for (int i = 0; i < MAX_LINE_WIDTH; i++) {",
		"float uvFactor = (float(1) / totalWidth);",
		"float newUvX = vUv.x + float(i - offset) * uvFactor;",
		"float newUvY = vUv.y + (float(i - offset) * float(diagOffset) ) * uvFactor;",  // only modifies vUv.y if diagOffset > 0
		"color = max(color, texture2D( tDiffuse, vec2( newUvX,  newUvY  ) ));	",
		// GLSL does not allow loop comparisons against dynamic variables. Workaround below
		"if(i == edgeWidth) break;",
		"};",
		
		// Now we create the vertical copies
		"for (int i = 0; i < MAX_LINE_WIDTH; i++) {",
		"float uvFactor = (float(1) / totalHeight);",
		"float newUvX = vUv.x + (float(i - offset) * float(-diagOffset) ) * uvFactor;", // only modifies vUv.x if diagOffset > 0
		"float newUvY = vUv.y + float(i - offset) * uvFactor;",
		"color = max(color, texture2D( tDiffuse, vec2( newUvX, newUvY ) ));	",
		"if(i == edgeWidth) break;",
		"};",
		
		"gl_FragColor = color;",
		
		"}"
	
	].join("\n")
	
};