package com.allegaeon.catworld.model;

import com.allegaeon.catworld.exception.BadRequestException;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Column;

@Embeddable
public record CatPhotoFrame(
        @Column(name = "frame_x") int frameX,
        @Column(name = "frame_y") int frameY,
        @Column(name = "frame_zoom") int frameZoom) {
    public CatPhotoFrame checked() {
        if (frameX < 0 || frameX > 100 || frameY < 0 || frameY > 100 || frameZoom < 100 || frameZoom > 300) {
            throw new BadRequestException("Invalid profile photo framing");
        }
        return this;
    }
}
