class Sound{
    isPlaying = false;
    constructor(relativePath,soundPath,loop){
        this.audio = $(document.createElement("audio"));
        this.audio.attr({'src':`${relativePath}/${soundPath}`,'preload':'auto','controls':'none','loop': loop || false}).hide();
        $('body').append(this.audio);
    }
    
    async play(dndPlay){
        dndPlay = dndPlay ?? false;
        if(dndPlay && this.isPlaying) return;
  
        this.audio[0].currentTime = 0;
        this.audio[0].play();
        this.isPlaying = true;
    }
    async stop(){
        this.audio[0].pause();
        this.isPlaying = false;
    }
  }