package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LibVipsCatPhotoNormalizerTest {
    private final LibVipsCatPhotoNormalizer normalizer = new LibVipsCatPhotoNormalizer();

    @Test
    void rejectsPresentEmptyAndMisleadingIsoBmffBeforeNativeDecode() {
        CatPhotoException empty = assertThrows(CatPhotoException.class,
                () -> normalizer.normalize(file(new byte[0], "empty.png")));
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT, empty.getCode());

        byte[] avif = ftyp("avif", "mif1");
        CatPhotoException misleading = assertThrows(CatPhotoException.class,
                () -> normalizer.normalize(file(avif, "misleading.heif")));
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT, misleading.getCode());

        byte[] generic = ftyp("mif1", "msf1");
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT,
                assertThrows(CatPhotoException.class,
                        () -> normalizer.normalize(file(generic, "generic.heif"))).getCode());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_VIPS", matches = "true")
    void normalizesTransparentPngWithPremultipliedResizeAndWhiteBackground() throws Exception {
        BufferedImage source = new BufferedImage(3200, 20, BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < source.getWidth(); x++) {
            int alpha = x < 1600 ? 0 : 128;
            int rgb = new Color(220, 30, 40, alpha).getRGB();
            for (int y = 0; y < source.getHeight(); y++) source.setRGB(x, y, rgb);
        }
        ByteArrayOutputStream encoded = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(source, "png", encoded));

        NormalizedCatPhoto result = normalizer.normalize(file(encoded.toByteArray(), "alpha.png"));
        BufferedImage jpeg = ImageIO.read(new ByteArrayInputStream(result.bytes()));

        assertEquals(1600, result.width());
        assertEquals(10, result.height());
        Color transparent = new Color(jpeg.getRGB(100, 5));
        assertTrue(transparent.getRed() > 245 && transparent.getGreen() > 245 && transparent.getBlue() > 245);
        Color translucent = new Color(jpeg.getRGB(1500, 5));
        assertTrue(translucent.getRed() > translucent.getGreen() + 60);
        assertEquals(64, result.sha256().length());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_VIPS", matches = "true")
    void acceptsNativeFamiliesAndCanonicalizesSixteenBitAlphaAndEmbeddedIcc() throws Exception {
        Path directory = Files.createTempDirectory("cat-photo-native-");
        run("vips", "black", directory.resolve("source.v").toString(), "32", "24", "--bands", "4");
        for (String extension : List.of("jpg", "png", "webp")) {
            Path input = directory.resolve("photo." + extension);
            run("vips", "copy", directory.resolve("source.v").toString(), input.toString());
            NormalizedCatPhoto normalized = normalizer.normalize(file(Files.readAllBytes(input), input.getFileName().toString()));
            assertEquals(32, normalized.width(), extension);
            assertEquals(24, normalized.height(), extension);
            assertArrayEquals(new byte[] {(byte) 0xff, (byte) 0xd8},
                    java.util.Arrays.copyOf(normalized.bytes(), 2), extension);
        }
        Path heic = directory.resolve("photo.heic");
        run("vips", "copy", directory.resolve("source.v").toString(), heic + "[compression=hevc]");
        assertEquals(32, normalizer.normalize(file(Files.readAllBytes(heic), "photo.heic")).width());
        NormalizedCatPhoto heif = normalizer.normalize(file(Files.readAllBytes(heic), "photo.heif"));
        assertEquals(32, heif.width());

        Path alpha16 = directory.resolve("alpha16.png");
        run("vips", "cast", directory.resolve("source.v").toString(), alpha16.toString(), "ushort");
        BufferedImage white = ImageIO.read(new ByteArrayInputStream(
                normalizer.normalize(file(Files.readAllBytes(alpha16), "alpha16.png")).bytes()));
        Color pixel = new Color(white.getRGB(10, 10));
        assertTrue(pixel.getRed() > 245 && pixel.getGreen() > 245 && pixel.getBlue() > 245);

        Path rgb = directory.resolve("rgb.v");
        Path profiled = directory.resolve("profiled.jpg");
        run("vips", "black", rgb.toString(), "16", "16", "--bands", "3");
        run("vips", "icc_export", rgb.toString(), profiled.toString(), "--output-profile", "p3");
        NormalizedCatPhoto transformed = normalizer.normalize(file(Files.readAllBytes(profiled), "profiled.jpg"));
        Path stripped = directory.resolve("stripped.jpg");
        Files.write(stripped, transformed.bytes());
        assertFalse(run("vipsheader", "-a", stripped.toString()).contains("icc-profile-data"));

        CatPhotoException undecodable = assertThrows(CatPhotoException.class,
                () -> normalizer.normalize(file(new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff}, "broken.jpg")));
        assertEquals(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE, undecodable.getCode());
    }

    private static MockMultipartFile file(byte[] bytes, String name) {
        return new MockMultipartFile("photo", name, "application/octet-stream", bytes);
    }

    private static byte[] ftyp(String major, String compatible) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bytes.writeBytes(new byte[] {0, 0, 0, 20});
        bytes.writeBytes("ftyp".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        bytes.writeBytes(major.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        bytes.writeBytes(new byte[4]);
        bytes.writeBytes(compatible.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        return bytes.toByteArray();
    }

    private static String run(String... command) throws Exception {
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        String output = new String(process.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        assertEquals(0, process.waitFor(), () -> String.join(" ", command) + "\n" + output);
        return output;
    }
}
