package com.allegaeon.catworld.service;

import app.photofox.vipsffm.VImage;
import app.photofox.vipsffm.Vips;
import app.photofox.vipsffm.VipsOption;
import app.photofox.vipsffm.enums.VipsInterpretation;
import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
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
        if (file == null || file.isEmpty()) {
            return null;
        }
        if (file.getSize() > MAX_BYTES) {
            throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_FILE_TOO_LARGE);
        }
        try {
            byte[] source = file.getBytes();
            if (!isSupported(source)) {
                throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT);
            }
            AtomicReference<NormalizedCatPhoto> result = new AtomicReference<>();
            Vips.run(arena -> {
                VImage image = VImage.newFromBytes(arena, source,
                        VipsOption.Boolean("fail", true));
                long pixels = Math.multiplyExact((long) image.getWidth(), image.getHeight());
                if (pixels > MAX_PIXELS) {
                    throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_DIMENSIONS_TOO_LARGE);
                }
                image = image.autorot();
                int longest = Math.max(image.getWidth(), image.getHeight());
                if (longest > MAX_SIDE) {
                    image = image.resize((double) MAX_SIDE / longest);
                }
                if (image.hasAlpha()) {
                    image = image.flatten(VipsOption.ArrayDouble("background", List.of(255d, 255d, 255d)));
                }
                image = image.colourspace(VipsInterpretation.INTERPRETATION_sRGB);
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
        } catch (CatPhotoException exception) {
            throw exception;
        } catch (Exception | LinkageError exception) {
            throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE);
        }
    }

    private static boolean isSupported(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return true;
        if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') return true;
        if (bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) return true;
        if (bytes.length >= 12 && ascii(bytes, 4, "ftyp")) {
            String brand = new String(bytes, 8, 4, java.nio.charset.StandardCharsets.US_ASCII);
            return brand.equals("heic") || brand.equals("heix") || brand.equals("hevc")
                    || brand.equals("hevx") || brand.equals("heim") || brand.equals("heis")
                    || brand.equals("mif1") || brand.equals("msf1");
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
