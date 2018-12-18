var game = window.game || {};
game.GameHelper = game.GameHelper || {};

game.GameHelper.LevelHelper = function(start, end) {
    this.current = start || 1;
    this.next = this.current + 1;
    this.count = end || 3;
    this.isFinished = true;

    this.getNext = function() {
        if (this.next > this.count) {
            this.current = 1;
            this.next = 2;
            this.isFinished = true;
        } else {
            this.current = this.next;
            this.next++;
        }

        return this.current;
    }
};

game.GameHelper.CameraHelper = function(camera) {
    this.translation = 5;
    this.rotation = 0.035;
    this.origin = {
        position: {
            x: 0,
            y: 0,
            z: 0,
            mapX: 0,
            mapY: 0,
            mapZ: 0
        },
        x: 0,
        y: 0,
        z: 0
    };
    
    this.camera = camera;
};