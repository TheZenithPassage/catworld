package com.allegaeon.catworld.security;

import com.allegaeon.catworld.service.DemoActivityService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@RequiredArgsConstructor
public class DemoRequestFilter extends OncePerRequestFilter {
    private static final String GENERATION_HEADER = "X-CatWorld-Demo-Generation";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private static final PathPatternRequestMatcher.Builder MATCHER = PathPatternRequestMatcher.withDefaults();
    private static final RequestMatcher API = MATCHER.matcher("/api/**");
    private static final RequestMatcher LOGIN = MATCHER.matcher(HttpMethod.POST, "/api/auth/login");
    private static final RequestMatcher RESET = MATCHER.matcher(HttpMethod.POST, "/api/demo/reset");
    private static final RequestMatcher PHOTO_PREVIEW = MATCHER.matcher(HttpMethod.POST, "/api/cats/photo-preview");
    private static final RequestMatcher NEW_STAY_PREVIEW = MATCHER.matcher(HttpMethod.POST, "/api/stays/pricing-preview");
    private static final RequestMatcher STAY_PREVIEW = MATCHER.matcher(HttpMethod.POST, "/api/stays/{id}/pricing-preview");
    private static final RequestMatcher PENDING_PRICE_PREVIEW = MATCHER.matcher(
            HttpMethod.POST, "/api/stays/{id}/pending-price-preview");

    private final DemoActivityService activity;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (LOGIN.matches(request)) {
            response.setHeader(GENERATION_HEADER, activity.generation());
        }
        if (!requiresGeneration(request)) {
            chain.doFilter(request, response);
            return;
        }
        if (rejectIfStale(request.getHeader(GENERATION_HEADER), response)) {
            return;
        }
        if (PHOTO_PREVIEW.matches(request)) {
            chain.doFilter(request, response);
            return;
        }
        activity.beginWrite();
        chain.doFilter(request, response);
        // An interrupted request or server error may have committed before the response failed.
        // Keep its durable marker so automatic restoration cannot discard that write.
        if (response.getStatus() < 500) {
            activity.finishWrite(response.getStatus() >= 200 && response.getStatus() < 300);
        }
    }

    public boolean rejectStaleWriteOnAuthenticationFailure(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String generation = request.getHeader(GENERATION_HEADER);
        return generation != null && requiresGeneration(request) && rejectIfStale(generation, response);
    }

    private boolean requiresGeneration(HttpServletRequest request) {
        return API.matches(request) && !SAFE_METHODS.contains(request.getMethod())
                && !LOGIN.matches(request) && !RESET.matches(request)
                && !NEW_STAY_PREVIEW.matches(request) && !STAY_PREVIEW.matches(request)
                && !PENDING_PRICE_PREVIEW.matches(request);
    }

    private boolean rejectIfStale(String generation, HttpServletResponse response) throws IOException {
        if (activity.generation().equals(generation)) {
            return false;
        }
        response.setStatus(HttpServletResponse.SC_CONFLICT);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"DEMO_RELOAD_REQUIRED\"}");
        return true;
    }
}
