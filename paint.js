class Paint{

    defaultBg = 'white';
    history = []
    currentIndex = -1;
    timer = null
    toolsSetting = {
        isFill: false,
        isDrawing: false,
        brushColor: 'black',
        brushSize: 1,
        isShape: false,
        isSpray: false,
        isText : false,
    }
    sounds = new GameSound();

    constructor(id){
        this.id = id
        this.element = document.getElementById(this.id)
    }

    resize(w,h){
        this.element.width = w;
        this.element.height = h;
        this.context.fillStyle = this.defaultBg
        this.context.fillRect(0,0,this.element.width,this.element.height)
        if(this.isDataExist){
            this.context.putImageData(this.history.at(-1),0,0)
        }
        return this
    }

    loadCanvas(w , h){
        this.context = this.element.getContext('2d',{ willReadFrequently: true });

        if(w && h){
            this.resize(w,h);
        }

        this.context.fillStyle = this.defaultBg
        this.context.fillRect(0,0,this.element.width,this.element.height)

        return this;
    }

    draw(x, y){
        this.context.strokeStyle = this.toolsSetting.brushColor
        this.context.lineWidth = this.toolsSetting.brushSize
        this.context.lineJoin = 'round' 
        this.context.lineCap =  'round' ;
        
        this.context.lineTo(x,y)
        this.context.stroke()

        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            this.save()
        },200)
    }

    floodFill(x, y) {
        const context = this.context;
        const canvasWidth = this.element.width;
        const canvasHeight = this.element.height;
        
        const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;
        
        // Get the starting pixel color
        const startIdx = (y * canvasWidth + x) * 4;
        const startColor = {
            r: data[startIdx],
            g: data[startIdx + 1],
            b: data[startIdx + 2],
            a: data[startIdx + 3],
        };
    
        const targetColor = this.hexToRgb(this.toolsSetting.brushColor);
    
        // Function to check if a pixel is the same color as the start color
        const matchStartColor = (index) => {
            return (
                data[index] === startColor.r &&
                data[index + 1] === startColor.g &&
                data[index + 2] === startColor.b &&
                data[index + 3] === startColor.a
            );
        };
    
        // Function to set a pixel to the target color
        const colorPixel = (index) => {
            data[index] = targetColor.r;
            data[index + 1] = targetColor.g;
            data[index + 2] = targetColor.b;
            data[index + 3] = 255; // Full opacity
        };
    
        // Flood fill using a queue for iterative implementation
        const pixelStack = [[x, y]];
    
        while (pixelStack.length) {
            const [px, py] = pixelStack.pop();
            const currentIdx = (py * canvasWidth + px) * 4;
    
            if (matchStartColor(currentIdx)) {
                colorPixel(currentIdx);
    
                // Add neighboring pixels to stack
                if (px > 0) pixelStack.push([px - 1, py]); // Left
                if (px < canvasWidth - 1) pixelStack.push([px + 1, py]); // Right
                if (py > 0) pixelStack.push([px, py - 1]); // Up
                if (py < canvasHeight - 1) pixelStack.push([px, py + 1]); // Down
            }
        }
    
        // Apply the updated image data to the canvas
        context.putImageData(imageData, 0, 0);
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    clear(){
        this.context.fillStyle = this.defaultBg
        this.context.fillRect(0,0,this.element.width,this.element.height)
        this.history = []
    }

    save(){
        this.history.push(this.context.getImageData(0,0,this.element.width,this.element.height))
        this.currentIndex++;
    }

    undo(){
        this.currentIndex--;
        this.history.pop()
        const lasthistory = this.history.at(-1);
        if(lasthistory)
            this.context.putImageData(lasthistory,0,0)
        else this.clear()
    }

    get isDataExist(){
        return this.history.length > 0;
    }

    downloadImage(){
        const dataURL = this.element.toDataURL('image/png'); 

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'canvas_image.png';

        link.click();
    }

    drawShapes(sheet, shape, start, end, fill){
        sheet.beginPath();
        if(!fill){
            sheet.lineWidth = this.toolsSetting.brushSize
            sheet.strokeStyle = this.toolsSetting.brushColor
        }
        else{
            sheet.fillStyle = this.toolsSetting.brushColor
        }
        
    
        switch(shape){
            case 'circle':
            case 'ellipse' :
                this.drawCircle(sheet, shape,start, end);
                break;
            case 'line' :
                sheet.lineCap = 'round';
                sheet.lineJoin = 'round'
                sheet.moveTo(start.x, start.y); 
                sheet.lineTo(end.x, end.y);
                break;
            case 'rect':
                sheet.rect(start.x, start.y, end.x - start.x, end.y - start.y);
                break;
            case 'triangle':
                sheet.beginPath()
                sheet.moveTo(start.x + 1,end.y - 1);
                sheet.lineTo(end.x,end.y - 1);
                sheet.lineTo(start.x + ((end.x - start.x) /2) + 1,start.y);
                sheet.closePath();  
        }
    
        fill ? sheet.fill() : sheet.stroke();
    }

    drawCircle(sheet, circleType,start, end){
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2; 
    
        if(circleType === 'circle'){
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) / 2;
            sheet.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        }
        else if (circleType === 'ellipse') {
            const radiusX = Math.abs(end.x - start.x) / 2;
            const radiusY = Math.abs(end.y - start.y) / 2;
        
            sheet.ellipse(centerX, centerY, radiusX - 1, radiusY - 1, 0, 0, 2 * Math.PI);
        }
       
    }

    spray(x, y) {
        const sprayRadius = this.toolsSetting.brushSize;   // Radius of the spray area
        const sprayDensity = 12;  // Number of dots per spray
    
        for (let i = 0; i < sprayDensity; i++) {
            const offsetX = (Math.random() - 0.5) * 2 * sprayRadius;
            const offsetY = (Math.random() - 0.5) * 2 * sprayRadius;
            const dotX = x + offsetX;
            const dotY = y + offsetY;
    
            this.context.beginPath();
            this.context.arc(dotX, dotY, 1, 0, 2 * Math.PI); // Draw each dot as a small circle
            let rgb = this.hexToRgba(this.toolsSetting.brushColor);
            this.context.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;  // Adjust color and opacity for airbrush effect
            this.context.fill();
            this.context.closePath();
            
        }
        
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            this.save()
        },200)
    }

    hexToRgba(hex) {
        let r = 0, g = 0, b = 0, a = 255;
    
        if (hex.length === 7) { // #RRGGBB
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        } else if (hex.length === 9) { // #RRGGBBAA
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
            a = parseInt(hex.slice(7, 9), 16);
        }
        return [r, g, b, a];
    }

    addText(info){

        this.context.fillStyle = info.bgColor;
        this.context.lineWidth = info.offset
        this.context.fillRect(info.posX, info.posY, info.width, info.height);

        // Set text properties
        this.context.font = `${info.fontSize} ${info.fontFamily}`;
        this.context.fillStyle = info.textColor;       // Text color
        this.context.textAlign = 'start';     // Center the text horizontally
        this.context.textBaseline = 'top';  // Center the text vertically


        this.context.fillText(info.text, info.posX + info.offsetX, info.posY + info.offsetY);

        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            this.save()
        },200)
    }
}

class GameSound{
    relativePath = 'assets/audio';
    paint = new Sound(this.relativePath,'paint.mp3');
    buttonClick = new Sound(this.relativePath,'button-click.mp3');
    scroll = new Sound(this.relativePath,'scroll.mp3');
    spray = new Sound(this.relativePath,'spray.mp3',true);
    draw = new Sound(this.relativePath,'drawing.mp3',true);
}