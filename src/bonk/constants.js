// export const CANVAS_SIZE = 700;
// export const TOTAL_BONK_SHAPES = 114;
// export const BALL_RADIUS_UNITS = 50;
// export const BALL_RADIUS_PX = CANVAS_SIZE / 2;
// export const PX_PER_UNIT = BALL_RADIUS_PX / BALL_RADIUS_UNITS;
// export const BONK_SCALE_FACTOR = 21.5;
// export const BONK_X_POS_FACTOR = 21.5;
// export const BONK_Y_POS_FACTOR = 21.5;

export const CANVAS_SIZE = 700;
export const TOTAL_BONK_SHAPES = 114;
export const BALL_RADIUS_UNITS = 50;
export const BALL_RADIUS_PX = CANVAS_SIZE / 2;            // 350
export const PX_PER_UNIT = BALL_RADIUS_PX / BALL_RADIUS_UNITS; // 7

// bonk's ball radius is exactly 15 skin-coordinate units (diameter 30 = the "30x30").
// px-per-bonk-unit on your canvas = ball_radius_px / 15 = CANVAS_SIZE / 30.
export const BONK_BALL_RADIUS_UNITS = 15;
export const BONK_UNIT_PX = BALL_RADIUS_PX / BONK_BALL_RADIUS_UNITS; // 350/15 = 23.333…

export const BONK_SCALE_FACTOR = BONK_UNIT_PX;
export const BONK_X_POS_FACTOR = BONK_UNIT_PX;
export const BONK_Y_POS_FACTOR = BONK_UNIT_PX;