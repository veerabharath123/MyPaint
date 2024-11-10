const $canvasSection = $('.canvas-section');
const $board = $('#board')
const $clearBtn = $('#clear')
const $undoBtn = $('#undo').hide()
const $downloadBtn = $('#download').hide()
const $brushSize = $('#brushSize')
const $brushSizeText = $('#brushSizeText')
const $colorPicker = $('#picker')
const $colorText = $('#code')
const $brushes = $('.brush-styles span')
const $shapes = $('.shapes span');
const $shapesSection = $('.shapes-section').hide()
const $textOverlay = $('.text-overlay')
const $colors = $('.color-palette-selection ul')
let wheelTimer;
let fillTimer;
const tempCanvas = document.createElement('canvas');
const tempContext = tempCanvas.getContext('2d');
const overlayCanvas = document.getElementById('overlay');
const overlayContext = overlayCanvas.getContext('2d');
const imgSrc = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 576 512"><path d="M41.4 9.4C53.9-3.1 74.1-3.1 86.6 9.4L168 90.7l53.1-53.1c28.1-28.1 73.7-28.1 101.8 0L474.3 189.1c28.1 28.1 28.1 73.7 0 101.8L283.9 481.4c-37.5 37.5-98.3 37.5-135.8 0L30.6 363.9c-37.5-37.5-37.5-98.3 0-135.8L122.7 136 41.4 54.6c-12.5-12.5-12.5-32.8 0-45.2zM217.4 230.7L168 181.3 75.9 273.4c-4.2 4.2-7 9.3-8.4 14.6h319.2l42.3-42.3c3.1-3.1 3.1-8.2 0-11.3L277.7 82.9c-3.1-3.1-8.2-3.1-11.3 0L213.3 136l49.4 49.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM512 512c-35.3 0-64-28.7-64-64 0-25.2 32.6-79.6 51.2-108.7 6-9.4 19.5-9.4 25.5 0C543.4 368.4 576 422.8 576 448c0 35.3-28.7 64-64 64z"/></svg>`)}`;
let startX = 0;
let startY = 0;

let width = parseInt($canvasSection.css('width'), 10);
let height = parseInt($canvasSection.css('height'), 10);
const canvas = new Paint($board.attr('id')).loadCanvas(width ,height);
overlayCanvas.width = width
overlayCanvas.height = height
$textOverlay.css({ 'width': width, 'height' : height})
const primaryColors = [
    "#FF0000", // Red
    "#FFA500", // Orange
    "#FFFF00", // Yellow
    "#008000", // Green
    "#0000FF", // Blue
    "#4B0082", // Indigo
    "#EE82EE", // Violet
    "#FFFFFF", // White
    "#000000", // Black
    "#808080", // Gray
    "#A52A2A", // Brown
    "#00FFFF", // Cyan
    "#FFC0CB", // Pink
    "#800080"  // Purple
];


function loadColors(){
    $colors.html('')
    primaryColors.forEach(color => {
        const $color = $('<span></span>').css({'background-color':color})
        $colors.append($('<li></li>').append($color))
    })
}
loadColors()

function loadBrushSize(){
    
    const size = parseInt($brushSize.val() || '1');
    canvas.toolsSetting.brushSize = size;
    $brushSizeText.val(size)
    loadTempCanvas()
}
function loadBrushColor(){
    const color = $colorPicker.val();
    canvas.toolsSetting.brushColor = color;
    $colorText.val(color)
}
function getOutlinedSvg(color, outlineColor = "#FFFFFF", outlineWidth = 2) {
    // Define the SVG string with a dynamic `fill` and `stroke` attribute
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 576 512">
            <path fill="${color}" stroke="${outlineColor}" stroke-width="${outlineWidth}" d="M41.4 9.4C53.9-3.1 74.1-3.1 86.6 9.4L168 90.7l53.1-53.1c28.1-28.1 73.7-28.1 101.8 0L474.3 189.1c28.1 28.1 28.1 73.7 0 101.8L283.9 481.4c-37.5 37.5-98.3 37.5-135.8 0L30.6 363.9c-37.5-37.5-37.5-98.3 0-135.8L122.7 136 41.4 54.6c-12.5-12.5-12.5-32.8 0-45.2zM217.4 230.7L168 181.3 75.9 273.4c-4.2 4.2-7 9.3-8.4 14.6h319.2l42.3-42.3c3.1-3.1 3.1-8.2 0-11.3L277.7 82.9c-3.1-3.1-8.2-3.1-11.3 0L213.3 136l49.4 49.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM512 512c-35.3 0-64-28.7-64-64 0-25.2 32.6-79.6 51.2-108.7 6-9.4 19.5-9.4 25.5 0C543.4 368.4 576 422.8 576 448c0 35.3-28.7 64-64 64z"/>
        </svg>`;
    
    // Encode the SVG string to Base64
    const base64Svg = btoa(svg);

    // Create a data URL for the image
    return `data:image/svg+xml;base64,${base64Svg}`;
}

function loadOptionBtns(){
    $undoBtn.show()
    $downloadBtn.show();
}

function cursorImage() {
    canvas.element.style.cursor = `url(${getOutlinedSvg("lightgrey")}) 16 16, auto`;
}

function loadTempCanvas() {
    if(canvas.toolsSetting.isFill) return;
    // Set the temporary canvas size based on the brush size
    const brushSize = canvas.toolsSetting.brushSize; 
    tempCanvas.width = brushSize + 4; // Increase width for the outer ring
    tempCanvas.height = brushSize + 4; // Increase height for the outer ring

    // Clear the temporary context
    tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height); 
    const isEraser = $('.brush-styles span.active').data('style') === 'eraser';
    
    // Create a data URL from the temporary canvas
    const data = isEraser ? getRectImage(brushSize) : getCircleImage(brushSize); 

    // Set the custom cursor with proper offset
    canvas.element.style.cursor = `url(${data}) ${brushSize / 2 + 2} ${brushSize / 2 + 2}, auto`; 
}

function getCircleImage(brushSize){
    tempContext.beginPath(); 
    tempContext.lineWidth = 1; // Thicker outer ring
    tempContext.strokeStyle = 'black'; 
    tempContext.arc((tempCanvas.width / 2), (tempCanvas.height / 2), (brushSize / 2) + 1, 0, Math.PI * 2); // Centered
    tempContext.stroke(); // Stroke the outer ring

    // Draw the inner white ring
    tempContext.beginPath(); 
    tempContext.lineWidth = 1; // Thinner inner ring
    tempContext.strokeStyle = 'white'; 
    tempContext.arc((tempCanvas.width / 2), (tempCanvas.height / 2), (brushSize / 2), 0, Math.PI * 2); // Centered
    tempContext.stroke(); // Stroke the inner ring

    return tempCanvas.toDataURL('image/png')
}
function getRectImage(brushSize){
    tempContext.beginPath();
    tempContext.lineWidth = 1; // Thicker outer ring
    tempContext.strokeStyle = 'black';
    tempContext.rect(2, 2, brushSize, brushSize); // Centered
    tempContext.stroke(); // Stroke the outer ring

    // Draw the inner white ring for square
    tempContext.beginPath();
    tempContext.fillStyle = 'white'
    tempContext.rect(3, 3, brushSize - 2, brushSize - 2); // Centered
    tempContext.fill()

    return tempCanvas.toDataURL('image/png')
}

loadBrushSize()
loadBrushColor()

$brushSize.on('input',() => {loadBrushSize();canvas.sounds.scroll.play();})
$colorPicker.on('input change',loadBrushColor).on('click',() => canvas.sounds.buttonClick.play())
$colors.find('li').on('click',function(){
    const index = $colors.find('li').index($(this))
    $colorPicker.val(primaryColors[index]).trigger('change')
})
function hexToRgba(hex, alpha) {
    // Remove the '#' if it's included
    hex = hex.replace(/^#/, '');
    
    // Convert hex to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Return RGBA with specified alpha
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
$brushes.on('click',function(){
    const $currentBrush = $(this);
    if(!$currentBrush.hasClass('active')){
        canvas.sounds.buttonClick.play()
        $brushes.removeClass('active')
        $currentBrush.addClass('active')
        canvas.toolsSetting.isFill = false
        canvas.toolsSetting.isShape = false;
        canvas.toolsSetting.isSpray = false;
        canvas.toolsSetting.isText = false;
        overlayCanvas.style.zIndex = -1;
        $textOverlay[0].style.zIndex = -1;
        $shapesSection.hide()
        loadTempCanvas()
        switch($currentBrush.data('style')){
            case 'paint':
                canvas.toolsSetting.isFill = true;
                cursorImage()
                break
            case 'eraser':
                canvas.toolsSetting.brushColor = 'white';
                break
            case 'spray':
                canvas.toolsSetting.isSpray = true;
                break;
            case 'text':
                canvas.toolsSetting.isText = true;
                $textOverlay[0].style.zIndex = 2;
                break;
            case 'shapes':
                canvas.toolsSetting.isShape = true;
                overlayCanvas.style.zIndex = 1;
                $shapesSection.show()
            default:
                const style = $currentBrush.data('style') == 'highlight'
                canvas.toolsSetting.brushSize = style ? 30 : canvas.toolsSetting.brushSize
                canvas.toolsSetting.brushColor = hexToRgba($colorPicker.val(), style ? 0.1 : 1)
        }
    }
})

window.addEventListener('resize1', function() {
    width = parseInt($canvasSection.css('width'), 10);
    height = parseInt($canvasSection.css('height'), 10);
    overlayCanvas.width = width;
    overlayCanvas.height = height
    canvas.resize(width, height);
});

$('.floater:is(.open,.close)').click(function(){
    const floater = $(this)
    if(floater.hasClass('open')){
        floater.hide();
        $('.floater.close').show()
        $('.tools-section').show();
    }
    else{
        floater.hide();
        $('.floater.open').show()
        $('.tools-section').hide();
    }
})
let evt = new Event('resize')
$('.floater.pin').click(function(){
    const floater = $(this)
    if(floater.find('i').hasClass('fa-thumbtack')){
        $('.floater:is(.open,.close)').hide()
        $('.tools-section').css({position: 'relative'})
        $('.container').css({ 'grid-template-columns' : '1fr 300px'})
        floater.find('i').removeClass('fa-thumbtack fa-thumbtack-slash').addClass('fa-thumbtack-slash')
        //$canvasSection.css('width', `calc(${$canvasSection.css('width')} - 300px)`)
    }
    else{
        $('.floater.close').show()
        $('.tools-section').css({position: 'absolute'})
        floater.find('i').removeClass('fa-thumbtack fa-thumbtack-slash').addClass('fa-thumbtack')
        $('.container').css({ 'grid-template-columns' : '1fr'})
        //$canvasSection.css('width', `calc(${$canvasSection.css('width')} + 300px)`)
        //canvas.resize(width, height);
    }
    //window.dispatchEvent(evt)
})

$(overlayCanvas).on('mousedown',function(e){
    if(canvas.toolsSetting.isShape){
        canvas.toolsSetting.isDrawing = true;

        const rect = overlayCanvas.getBoundingClientRect()

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        startX = x
        startY = y
    }
})
.on('mousemove',function(e){
    if(canvas.toolsSetting.isDrawing && canvas.toolsSetting.isShape){
        const rect = overlayCanvas.getBoundingClientRect()

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        canvas.drawShapes(overlayContext, $('.shapes span.active').data('shape'), {x : startX, y : startY}, {x : x, y : y})
    }
})
.on('mouseup mouseout',function(e){
    if(canvas.toolsSetting.isDrawing && canvas.toolsSetting.isShape) {
        const rect = overlayCanvas.getBoundingClientRect()

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        canvas.toolsSetting.isDrawing = false;
        overlayContext.closePath();

        canvas.drawShapes(canvas.context, $('.shapes span.active').data('shape'), {x : startX, y : startY}, {x : x, y : y})
        overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        canvas.save()
        loadOptionBtns()
    }
    
})
function enterFullScreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
        document.documentElement.webkitRequestFullscreen();
    }
}

enterFullScreen()


$board.on('mousedown touchstart',function(e){
    const events = e.type === 'touchstart' ? e.touches[0] : e;
    if(!canvas.toolsSetting.isFill){
        canvas.toolsSetting.isDrawing = true;

        const rect = canvas.element.getBoundingClientRect()

        const x = events.clientX - rect.left
        const y = events.clientY - rect.top

        canvas.context.beginPath();
        canvas.context.moveTo(x,y);
        if(canvas.toolsSetting.isSpray){
            canvas.spray(x,y)
            //canvas.sounds.spray.play(true)
        }
            
        else{
            canvas.draw(x,y)
            //canvas.sounds.draw.play(true)
        } 
    }
    e.preventDefault()
})
.on('mouseup mouseout touchend touchcancel',function(e){
    if (canvas.toolsSetting.isDrawing && !canvas.toolsSetting.isFill && !canvas.toolsSetting.isShape && !canvas.toolsSetting.isText){
        canvas.toolsSetting.isDrawing = false;

        canvas.context.closePath();
        loadOptionBtns()
        canvas.sounds.spray.stop()
        canvas.sounds.draw.stop()
    }
    
})
.on('mousemove touchmove',function(e){
    e.preventDefault()
    const events = e.type === 'touchmove' ? e.touches[0] : e;
    if(canvas.toolsSetting.isDrawing && !canvas.toolsSetting.isFill){
        const rect = canvas.element.getBoundingClientRect()
        const x = events.clientX - rect.left
        const y = events.clientY - rect.top

        if(canvas.toolsSetting.isSpray) 
            canvas.spray(x,y)
        else canvas.draw(x,y)
        
    }
})
.on('click touchend', function(e) {
    const events = e.type === 'touchend' ? e.touches[0] : e;
    if (canvas.toolsSetting.isFill) {
        const rect = canvas.element.getBoundingClientRect();
        const x = events.clientX - rect.left;
        const y = events.clientY - rect.top;
        clearTimeout(fillTimer)
        fillTimer = setTimeout(() => {
            canvas.floodFill(x, y)
            canvas.save()
            canvas.sounds.paint.play();
        },200)
    }
    e.preventDefault()
})
$('#board,#overlay').on('wheel',function(e){
    e.preventDefault(); // Prevent default scroll behavior

    const delta = Math.sign(e.originalEvent.deltaY); // Check the scroll direction
    if (delta < 0) {
        // Scrolling up
        canvas.toolsSetting.brushSize = Math.min(canvas.toolsSetting.brushSize + 1, 100); // Max size 100
    } else {
        // Scrolling down
        canvas.toolsSetting.brushSize = Math.max(canvas.toolsSetting.brushSize - 1, 1); // Min size 1
    }
    clearTimeout(wheelTimer)
    wheelTimer = setTimeout(()=>{
        $brushSize.val(canvas.toolsSetting.brushSize)
        loadBrushSize()
    },200)
    canvas.sounds.scroll.play()
})

$clearBtn.on('click',function(){
    canvas.clear()
    $undoBtn.hide();
})

$undoBtn.on('click',function(){
    canvas.undo()
    if(!canvas.isDataExist){
        $undoBtn.hide()
        $downloadBtn.hide()
    }
})

$downloadBtn.on('click',function(){
    canvas.downloadImage()
})

$shapes.on('click',function(){
    const element = $(this)
    if(!element.hasClass('active')){
        canvas.sounds.buttonClick.play()
        $shapes.removeClass('active')
        element.addClass('active')
    }
})

let textX = 0;
let textY = 0;
let textShape; 
let editable = false;

$textOverlay.on('mousedown',function(e){
    if(!canvas.toolsSetting.isText || textShape && e.target == textShape[0]) return
        if(editable){
            editable = false;
            $textOverlay.html('')
            return
        }
        const rect = this.getBoundingClientRect()
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        textX = x;
        textY = y;

        textShape = $(`<div class="text-shape editable"></div>`)
        $textOverlay.html(textShape)
        textShape.css({ 'left' : x , 'top' : y}).attr('contenteditable',true)
        canvas.toolsSetting.isDrawing = true
})
.on('mousemove',function(e){
    if(canvas.toolsSetting.isDrawing && canvas.toolsSetting.isText){
        const rect = this.getBoundingClientRect()
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        textShape.css({ 'width' : x - textX , 'height' : y - textY})
    }
})
.on('mouseup',function(e){
    if(canvas.toolsSetting.isDrawing && canvas.toolsSetting.isText){
        canvas.toolsSetting.isDrawing = false
        textShape.focus()
    }
})

$(document).on('focus','.text-shape',function(e){
    if(canvas.toolsSetting.isText){
        editable = true;
    }
})
.on('blur','.text-shape',function(){
    const text = textShape?.text() ?? ''
    if(canvas.toolsSetting.isText && text){
        canvas.addText({
            textColor: textShape.css('color'),
            fontSize : textShape.css('font-size'),
            fontFamily : textShape.css('font-family'),
            width : parseInt(textShape.css('width'),10),
            height : parseInt(textShape.css('height'),10),
            bgColor: textShape.css('background-color'),
            text : text,
            posX : textX,
            posY : textY,
            offsetX: 1.5,
            offsetY: 2.5
        })
        loadOptionBtns()
    }
    textShape = null
    $textOverlay.html('')
    editable = false;
})

let moving = false;
let movingF = false
let mx = 0;
let my = 0;
const $tools = $('.tools-section')

$('.draggable').on('mousedown',function(e){
    moving = true;
    const r = $tools[0].getBoundingClientRect()
    const x1 = e.clientX - r.left;
    const y2 = e.clientY - r.top;
    mx = x1;
    my = y2 
})
$('.container').on('mousemove',function(e){
    if(moving){
        const rect = this.getBoundingClientRect()
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        $tools.css({ left : x - mx , top : y - my})
    }
})
$('.container').on('mouseup',function(){
    moving = false;
})
$('.floater.open').on('mousedown',function(e){
    
    const r = this.getBoundingClientRect()
    const y2 = e.clientY - r.top;
    my = y2 
    setTimeout(() => {
        movingF = true;
    },200)
})
$('.container').on('mousemove',function(e){
    if(movingF){
        const rect = this.getBoundingClientRect()
        const y = e.clientY - rect.top;

        $('.floater.open').css({ top : y - my})
    }
})
$('.container').on('mouseup',function(){
    setTimeout(() => {
        movingF = false;
    },500)
})
$(document).on('keydown',function(e){
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        $undoBtn.click()
    }
})