package com.allegaeon.catworld.service;

import app.photofox.vipsffm.VImage;
import app.photofox.vipsffm.Vips;
import app.photofox.vipsffm.VipsError;
import app.photofox.vipsffm.VipsOption;
import app.photofox.vipsffm.enums.VipsBandFormat;
import app.photofox.vipsffm.enums.VipsInterpretation;
import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class LibVipsCatPhotoNormalizer {
    static final long MAX_BYTES = 32L * 1024 * 1024;
    static final long MAX_PIXELS = 120_000_000L;
    static final int MAX_SIDE = 1600;

    public NormalizedCatPhoto normalize(MultipartFile file) {
        if (file == null) {
            return null;
        }
        if (file.getSize() > MAX_BYTES) {
            throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_FILE_TOO_LARGE);
        }
        final byte[] source;
        try {
            source = file.getBytes();
        } catch (IOException exception) {
            throw new IllegalStateException("Could not read cat photo upload", exception);
        }
        if (!isSupported(source)) {
            throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT);
        }
        AtomicReference<NormalizedCatPhoto> result = new AtomicReference<>();
        Vips.run(arena -> {
            VImage image;
            try {
                image = VImage.newFromBytes(arena, source, VipsOption.Boolean("fail", true));
            } catch (VipsError exception) {
                throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE);
            }
            long pixels = Math.multiplyExact((long) image.getWidth(), image.getHeight());
            if (pixels > MAX_PIXELS) {
                throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_DIMENSIONS_TOO_LARGE);
            }
            try {
                image.avg(); // Force pixel decoding while source failures are still a client boundary.
            } catch (VipsError exception) {
                throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE);
            }
            image = image.autorot();

            if (image.getFields().contains("icc-profile-data")) {
                image = image.iccTransform("srgb", VipsOption.Boolean("embedded", true));
            } else {
                image = image.colourspace(VipsInterpretation.INTERPRETATION_sRGB);
            }
            image = image.cast(VipsBandFormat.FORMAT_UCHAR, VipsOption.Boolean("shift", true));

            int longest = Math.max(image.getWidth(), image.getHeight());
            double scale = longest > MAX_SIDE ? (double) MAX_SIDE / longest : 1d;
            if (image.hasAlpha()) {
                image = image.premultiply();
                if (scale < 1d) image = image.resize(scale);
                image = image.unpremultiply().cast(VipsBandFormat.FORMAT_UCHAR);
                image = image.flatten(VipsOption.ArrayDouble("background", List.of(255d, 255d, 255d)));
            } else if (scale < 1d) {
                image = image.resize(scale);
            }
            int width = image.getWidth();
            int height = image.getHeight();
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            image.writeToStream(output, ".jpg",
                    VipsOption.Int("Q", 85),
                    VipsOption.Boolean("strip", true),
                    VipsOption.Boolean("keep", false));
            byte[] encoded = output.toByteArray().clone();
            result.set(new NormalizedCatPhoto(encoded, width, height, sha256(encoded)));
        });
        return result.get();
    }

    private static boolean isSupported(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return true;
        if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') return true;
        if (bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) return true;
        if (bytes.length >= 16 && ascii(bytes, 4, "ftyp")) {
            long boxSize = Integer.toUnsignedLong(java.nio.ByteBuffer.wrap(bytes, 0, 4).getInt());
            if (boxSize < 16 || boxSize > bytes.length || boxSize > Integer.MAX_VALUE) return false;
            boolean approved = false;
            for (int offset = 8; offset + 4 <= (int) boxSize; offset += offset == 8 ? 8 : 4) {
                String brand = new String(bytes, offset, 4, StandardCharsets.US_ASCII);
                if (brand.equals("avif") || brand.equals("avis")) return false;
                approved |= brand.equals("heic") || brand.equals("heix") || brand.equals("hevc")
                        || brand.equals("hevx") || brand.equals("heim") || brand.equals("heis");
            }
            return approved;
        }
        return false;
    }

    private static boolean ascii(byte[] bytes, int offset, String value) {
        for (int i = 0; i < value.length(); i++) if (bytes[offset + i] != value.charAt(i)) return false;
        return true;
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
