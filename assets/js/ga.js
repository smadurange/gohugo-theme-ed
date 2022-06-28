function isDoNotTrackEnabled() {
    if (typeof window === 'undefined') return false
    const {doNotTrack, navigator} = window

    // Do Not Track Settings across browsers
    const dnt = (doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack)

    if (!dnt) return false

    return dnt === true ||
        dnt === 1 ||
        dnt === 'yes' ||
        (typeof dnt === 'string' && dnt.charAt(0) === '1');
}

if (isDoNotTrackEnabled()) {
    // Skip analytics for users with Do Not Track enabled
    console.info('[TRACKING]: Respecting DNT with respect to analytics...')
} else {
    // Known DNT values not set, so we will assume it's off.
    const data = JSON.parse(document.getElementById('ed-data').innerHTML)

    if (typeof data !== 'undefined' && data.analytics_code) {
        (function () {
            // New Google Site Tag (gtag.js) tagging/analytics framework
            // See: https://developers.google.com/gtagjs
            const base_url = 'https://www.googletagmanager.com'
            let script = document.createElement("script");

            script.src = base_url + "/gtag/js?id=" + data.analytics_code;
            script.type = "text/javascript";
            script.async = true;

            document.getElementsByTagName("head")[0].appendChild(script);
        }())

        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }

        function trackOutboundLink(url, target) {
            gtag('event', 'click', {
                 'event_category': 'outbound',
                 'event_label': url,
                 'transport_type': 'beacon',
                 'event_callback': function () {
                   if (target !== '_blank') {
                     document.location = url;
                   }
                 }
            });
        }

        function trackInternalEvent(label, category) {
            gtag('event', 'click', {
                'event_label': label,
                'event_category': category
            });
        }

        function onClickCallback(event) {
            const className = event.target.getAttribute('class');
            if (className === 'sidebar-toggle') {
                trackInternalEvent('Sidebar Toggle', 'navigation');
                return;
            }

            // Track only external URLs.
            if ((event.target.tagName !== 'A') || (event.target.host === window.location.host)) {
                return;
            }

            // Send GA event.
            trackOutboundLink(
                event.target,
                event.target.getAttribute('target')
            );
        }

        gtag('js', new Date());

        // Setup the project analytics code and send a pageview
        gtag('config', data.analytics_code, {
            'page_title': data.page_title,
            'anonymize_ip': true,
            'cookie_expires': 30 * 24 * 60 * 60  // 30 days, in seconds
        })

        gtag('set', {'cookie_flags': 'SameSite=None;Secure'});

        // Outbound link tracking.
        document.addEventListener('click', onClickCallback, false);
    }
}
