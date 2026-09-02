import React, { useState, useEffect, useRef } from "react";
import {
  Search, MapPin, ChevronRight, ChevronLeft, Menu, X, Hammer, MessageSquare, Plus,
  Loader2, User, Send, Star, Flag, Heart, ShieldCheck, Trash2, FileText,
  Building2, PaintRoller, Droplet, Zap, TreePine, Wrench, Leaf, Recycle, Paperclip,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { LOGO_URL } from "./logo";
import { ARTICLES } from "./articles";
import { track } from "@vercel/analytics";

const CATEGORIES = [
  { code: "01", name: "Gros œuvre", icon: Building2, subs: ["Béton & ciment", "Parpaings & briques", "Ferraillage", "Coffrage", "Charpente bois"] },
  { code: "02", name: "Second œuvre", icon: PaintRoller, subs: ["Placo & isolation", "Carrelage & faïence", "Peinture & enduit", "Menuiserie int.", "Sols souples"] },
  { code: "03", name: "Plomberie", icon: Droplet, subs: ["Tuyauterie PER/cuivre", "Sanitaires", "Chauffe-eau", "Raccords", "Robinetterie"] },
  { code: "04", name: "Électricité", icon: Zap, subs: ["Câbles & gaines", "Tableaux", "Luminaires", "Appareillage", "Domotique"] },
  { code: "05", name: "Extérieur", icon: TreePine, subs: ["Clôtures", "Dallage & pavés", "Bois de terrasse", "Portails", "Toiture"] },
  { code: "06", name: "Outillage", icon: Wrench, subs: ["Électroportatif", "Outillage à main", "EPI", "Échafaudage", "Location de matériel"] },
];

const DEPARTEMENTS = [
  "01 - Ain", "02 - Aisne", "03 - Allier", "04 - Alpes-de-Haute-Provence", "05 - Hautes-Alpes",
  "06 - Alpes-Maritimes", "07 - Ardèche", "08 - Ardennes", "09 - Ariège", "10 - Aube",
  "11 - Aude", "12 - Aveyron", "13 - Bouches-du-Rhône", "14 - Calvados", "15 - Cantal",
  "16 - Charente", "17 - Charente-Maritime", "18 - Cher", "19 - Corrèze", "2A - Corse-du-Sud",
  "2B - Haute-Corse", "21 - Côte-d'Or", "22 - Côtes-d'Armor", "23 - Creuse", "24 - Dordogne",
  "25 - Doubs", "26 - Drôme", "27 - Eure", "28 - Eure-et-Loir", "29 - Finistère",
  "30 - Gard", "31 - Haute-Garonne", "32 - Gers", "33 - Gironde", "34 - Hérault",
  "35 - Ille-et-Vilaine", "36 - Indre", "37 - Indre-et-Loire", "38 - Isère", "39 - Jura",
  "40 - Landes", "41 - Loir-et-Cher", "42 - Loire", "43 - Haute-Loire", "44 - Loire-Atlantique",
  "45 - Loiret", "46 - Lot", "47 - Lot-et-Garonne", "48 - Lozère", "49 - Maine-et-Loire",
  "50 - Manche", "51 - Marne", "52 - Haute-Marne", "53 - Mayenne", "54 - Meurthe-et-Moselle",
  "55 - Meuse", "56 - Morbihan", "57 - Moselle", "58 - Nièvre", "59 - Nord",
  "60 - Oise", "61 - Orne", "62 - Pas-de-Calais", "63 - Puy-de-Dôme", "64 - Pyrénées-Atlantiques",
  "65 - Hautes-Pyrénées", "66 - Pyrénées-Orientales", "67 - Bas-Rhin", "68 - Haut-Rhin", "69 - Rhône",
  "70 - Haute-Saône", "71 - Saône-et-Loire", "72 - Sarthe", "73 - Savoie", "74 - Haute-Savoie",
  "75 - Paris", "76 - Seine-Maritime", "77 - Seine-et-Marne", "78 - Yvelines", "79 - Deux-Sèvres",
  "80 - Somme", "81 - Tarn", "82 - Tarn-et-Garonne", "83 - Var", "84 - Vaucluse",
  "85 - Vendée", "86 - Vienne", "87 - Haute-Vienne", "88 - Vosges", "89 - Yonne",
  "90 - Territoire de Belfort", "91 - Essonne", "92 - Hauts-de-Seine", "93 - Seine-Saint-Denis",
  "94 - Val-de-Marne", "95 - Val-d'Oise",
  "971 - Guadeloupe", "972 - Martinique", "973 - Guyane", "974 - La Réunion", "976 - Mayotte",
];

// Compresse et redimensionne une photo avant envoi vers Supabase, pour limiter
// la bande passante consommée (les photos de smartphone font souvent plusieurs Mo,
// alors qu'une largeur de 1600px à qualité 80% suffit largement pour le web).
function compressImage(file, maxDim = 1600, quality = 0.8) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) { resolve(file); return; }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else { width = Math.round(width * (maxDim / height)); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function categoryIcon(catName) {
  const cat = CATEGORIES.find((c) => c.name === catName);
  return cat ? cat.icon : Hammer;
}

function nextRef(catName, existing) {
  const ascii = (catName || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const prefix = ascii.slice(0, 2).toUpperCase();
  const n = existing.filter((l) => (l.ref || "").startsWith(prefix)).length + 1;
  return `${prefix}-${String(1000 + n)}`;
}

// Récupère les paramètres UTM capturés à l'arrivée sur le site (voir l'effet dans App), pour
// les rattacher aux événements suivis. Permet de distinguer le trafic publicitaire (Facebook,
// etc.) du reste dans Vercel Analytics, même si le visiteur convertit après avoir navigué.
function utmProps() {
  try {
    const source = sessionStorage.getItem("utm_source");
    if (!source) return {};
    const campaign = sessionStorage.getItem("utm_campaign");
    return campaign ? { utm_source: source, utm_campaign: campaign } : { utm_source: source };
  } catch {
    return {};
  }
}

export default function App() {
  // Microsoft Clarity — enregistrements de session et cartes thermiques, pour observer
  // le comportement réel des visiteurs (clics, scroll, points d'abandon)
  useEffect(() => {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", "y5j3vz2rpx");
  }, []);

  // Police plus affirmée que la police système par défaut (jugée "fade") : Archivo a un style
  // robuste qui colle mieux à l'univers BTP que la police sans-serif générique du navigateur.
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap";
    document.head.appendChild(link);
  }, []);

  // Meta Pixel (Facebook) — permet à Meta de savoir qui, parmi les visiteurs venus des
  // publicités, effectue réellement des actions sur le site (voir plus bas : inscription et
  // clic Contacter), pour optimiser les campagnes vers ce profil plutôt que juste vers le clic.
  useEffect(() => {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return; f.fbq = n = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0";
      n.queue = []; t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", "921709697103912");
    window.fbq("track", "PageView");
  }, []);

  // Capture les paramètres UTM (ex: ?utm_source=facebook&utm_campaign=test1) présents dans
  // l'URL à l'arrivée sur le site, et les garde en mémoire pour toute la session (sessionStorage)
  // afin de pouvoir rattacher un événement de conversion (inscription, contact...) à la source
  // publicitaire, même si le visiteur navigue sur plusieurs pages avant de convertir.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const source = params.get("utm_source");
      if (source) {
        sessionStorage.setItem("utm_source", source);
        const campaign = params.get("utm_campaign");
        if (campaign) sessionStorage.setItem("utm_campaign", campaign);
      }
    } catch {
      // sessionStorage indisponible (navigation privée stricte, etc.) : on ignore simplement,
      // le suivi UTM n'est pas critique au fonctionnement du site.
    }
  }, []);

  // Navigation simple par URL, sans dépendance externe : "home", "blog" ou "blog/<slug>"
  const [page, setPage] = useState(() => {
    const path = window.location.pathname.replace(/^\/|\/$/g, "");
    return path.startsWith("blog") ? path : "home";
  });
  function navigate(path) {
    window.history.pushState({}, "", path);
    setPage(path.replace(/^\/|\/$/g, "") || "home");
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    function onPopState() {
      const path = window.location.pathname.replace(/^\/|\/$/g, "");
      setPage(path.startsWith("blog") ? path : "home");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    if (page === "home") {
      document.title = "Le Castor — Matériaux & matériel BTP";
    } else if (page === "blog") {
      document.title = "Blog — Le Castor";
      track("Page blog vue");
    } else {
      const slug = page.replace("blog/", "");
      const article = ARTICLES.find((a) => a.slug === slug);
      document.title = article ? `${article.title} — Le Castor` : "Blog — Le Castor";
      if (article) track("Article blog vu", { slug });
    }
  }, [page]);

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success" | "error", text } | null
  const [form, setForm] = useState({
    title: "", cat: CATEGORIES[0].name, sub: CATEGORIES[0].subs[0],
    qty: "", cond: "Neuf", price: "", loc: "", departement: "", contact: "", displayName: "", description: "", photoFiles: [null, null, null], existingImageUrls: [],
  });
  const [error, setError] = useState("");

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // "signup" | "signin"
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const [detailFor, setDetailFor] = useState(null);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0);

  const [chatFor, setChatFor] = useState(null);
  const [chatBuyerId, setChatBuyerId] = useState(null);
  const [chatOtherName, setChatOtherName] = useState(null);
  const [showInbox, setShowInbox] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [chatPhotoFile, setChatPhotoFile] = useState(null);
  const [chatPhotoPreview, setChatPhotoPreview] = useState(null);
  const [chatPhotoUploading, setChatPhotoUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeDepartement, setActiveDepartement] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [savedSearches, setSavedSearches] = useState([]);

  const [reviews, setReviews] = useState({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const [reportFor, setReportFor] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const [showAccount, setShowAccount] = useState(false);
  const [showLegal, setShowLegal] = useState(null);
  const [showContestBanner, setShowContestBanner] = useState(true);

  // Session & profil
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    (async () => {
      // .maybeSingle() plutôt que .single() : évite une erreur 406 si le profil n'existe pas encore
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (data) {
        setProfile(data);
      } else {
        // Le profil n'a pas pu être créé à l'inscription (pas de session active tant que l'email
        // n'est pas confirmé) — on le crée maintenant qu'une vraie session existe.
        const fallbackName = session.user.user_metadata?.name || session.user.email.split("@")[0];
        const { data: created } = await supabase.from("profiles").insert({
          id: session.user.id, name: fallbackName, email: session.user.email,
        }).select().maybeSingle();
        setProfile(created || null);
      }
    })();
  }, [session]);

  // Annonces
  async function loadListings() {
    setLoading(true);
    const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
    if (!error) setListings(data || []);
    setLoading(false);
  }
  useEffect(() => { loadListings(); }, []);

  // Lien direct depuis une pub ou un partage : ?ref=OU-1008 ouvre directement le détail de
  // cette annonce, ?q=terme pré-remplit la recherche. Sans ça, un clic depuis une pub qui montre
  // une annonce précise atterrissait sur la page d'accueil générale — décalage entre la promesse
  // de la pub et ce que la personne voit en arrivant, probable cause d'abandon.
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || listings.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        const match = listings.find((l) => l.ref === ref);
        if (match) {
          setDetailFor(match);
          setDetailPhotoIndex(0);
          deepLinkHandledRef.current = true;
          return;
        }
      }
      const q = params.get("q");
      if (q) {
        setSearchQuery(q);
        deepLinkHandledRef.current = true;
      }
    } catch {
      // Paramètres d'URL indisponibles ou invalides : on ignore simplement, l'accueil
      // classique s'affiche.
    }
  }, [listings]);

  // Favoris & alertes (par utilisateur connecté)
  useEffect(() => {
    if (!session) { setFavorites([]); setSavedSearches([]); return; }
    (async () => {
      const { data: favs } = await supabase.from("favorites").select("listing_ref").eq("user_id", session.user.id);
      setFavorites((favs || []).map((f) => f.listing_ref));
      const { data: searches } = await supabase.from("saved_searches").select("id, query").eq("user_id", session.user.id);
      setSavedSearches(searches || []);
    })();
  }, [session]);

  // Avis (publics)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("reviews").select("*");
      const grouped = {};
      (data || []).forEach((r) => {
        grouped[r.owner_name] = grouped[r.owner_name] || [];
        grouped[r.owner_name].push(r);
      });
      setReviews(grouped);
    })();
  }, []);

  function normalize(str) {
    return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  const [photoIndex, setPhotoIndex] = useState({});

  const filtered = listings
    .filter((l) => (activeCategory ? l.cat === activeCategory : true))
    .filter((l) => (activeSubCategory ? l.sub === activeSubCategory : true))
    .filter((l) => (activeDepartement ? l.departement === activeDepartement : true))
    .filter((l) => (showFavoritesOnly ? favorites.includes(l.ref) : true))
    .filter((l) => {
      if (!searchQuery.trim()) return true;
      const q = normalize(searchQuery.trim());
      return normalize(l.title).includes(q) || normalize(l.cat).includes(q) || normalize(l.ref).includes(q) || normalize(l.sub).includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return parseFloat(a.price) - parseFloat(b.price) || 0;
      if (sortBy === "price_desc") return parseFloat(b.price) - parseFloat(a.price) || 0;
      return 0;
    });

  function ownerRating(ownerName) {
    const list = reviews[ownerName] || [];
    if (list.length === 0) return null;
    const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
    return { avg, count: list.length };
  }

  // Auth
  async function handleAuth(e) {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError("");
    if (!authForm.email.trim() || !authForm.password.trim() || (authMode === "signup" && !authForm.name.trim())) {
      setAuthError("Merci de remplir tous les champs.");
      return;
    }
    setAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email.trim(),
          password: authForm.password,
          options: { data: { name: authForm.name.trim() } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id, name: authForm.name.trim(), email: authForm.email.trim(),
          });
        }
        // Si Supabase demande une confirmation par email, il n'y a pas encore de session active
        if (!data.session) {
          track("Inscription terminee", utmProps());
          if (window.fbq) window.fbq("track", "CompleteRegistration");
          setSignupDone(true);
          setAuthForm({ name: "", email: "", password: "" });
          setAuthSubmitting(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email.trim(),
          password: authForm.password,
        });
        if (error) throw error;
      }
      setShowLogin(false);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (err) {
      setAuthError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : err.message);
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setShowAccount(false);
  }

  // Dépôt d'annonce
  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    if (!form.title || !form.qty || !form.price || !form.loc || !form.contact) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setSaving(true);
    try {
      // Vérification IA : l'annonce doit bien concerner le BTP avant d'aller plus loin
      const { data: checkResult } = await supabase.functions.invoke("check-listing", {
        body: { title: form.title, description: form.description, cat: form.cat, sub: form.sub },
      });
      if (checkResult && checkResult.ok === false) {
        setError(checkResult.reason || "Cette annonce ne semble pas concerner le bâtiment/BTP.");
        setSaving(false);
        return;
      }

      // On va chercher le profil à jour plutôt que de se rabattre sur l'email
      let ownerName = profile ? profile.name : null;
      if (!ownerName) {
        const { data: freshProfile } = await supabase.from("profiles").select("name").eq("id", session.user.id).maybeSingle();
        ownerName = freshProfile ? freshProfile.name : "Membre Le Castor";
        if (freshProfile) setProfile(freshProfile);
      }

      // Ajoute automatiquement le symbole € si seul un nombre a été saisi
      let price = form.price.trim();
      if (/^\d+([.,]\d+)?$/.test(price)) price = `${price} €`;

      // "ref" (ex: "PL-1003") n'est calculé que pour une NOUVELLE annonce : c'est un simple
      // libellé d'affichage, recalculé à chaque appel à partir du nombre d'annonces existantes,
      // donc PAS garanti unique dans le temps (deux calculs à des moments différents peuvent
      // retomber sur la même valeur). Il ne doit jamais servir à construire un chemin de
      // stockage : voir "uniqueKey" plus bas, qui corrige le bug de photos mélangées entre annonces.
      const ref = editingListingId ? null : nextRef(form.cat, listings);

      // Envoie chaque nouvelle photo sélectionnée vers le stockage Supabase
      // (en édition, si aucune nouvelle photo n'est choisie, on garde les photos existantes)
      //
      // FIX : on utilise une clé réellement unique par annonce (son id en édition, ou un
      // horodatage pour une création) + un horodatage supplémentaire par fichier dans le chemin
      // de stockage. Avant ce correctif, le chemin utilisait "ref" (voir ci-dessus), qui pouvait
      // coïncider avec le ref d'une autre annonce déjà modifiée : avec upsert:true, la seconde
      // upload écrasait alors le fichier de la première au même endroit (même URL publique),
      // ce qui faisait apparaître la photo d'une autre annonce à sa place.
      let imageUrls = form.existingImageUrls || [];
      const filesToUpload = form.photoFiles.filter(Boolean);
      if (filesToUpload.length) {
        imageUrls = [];
        const uniqueKey = editingListingId || `new-${Date.now()}`;
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = await compressImage(filesToUpload[i]);
          const ext = file.name.split(".").pop();
          const path = `${session.user.id}/${uniqueKey}-${i}-${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file, { upsert: true });
          if (uploadError) throw new Error("Envoi de la photo impossible : " + uploadError.message);
          const { data: publicUrlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      const listingData = {
        title: form.title, qty: form.qty, cond: form.cond, price,
        loc: form.loc, departement: form.departement, cat: form.cat, sub: form.sub, contact: form.contact,
        description: form.description.trim() || null,
        image_url: imageUrls[0] || null,
        image_urls: imageUrls.length ? imageUrls : null,
        owner_name: form.displayName.trim() || ownerName,
      };

      if (editingListingId) {
        const { error } = await supabase.from("listings").update(listingData).eq("id", editingListingId);
        if (error) throw error;
      } else {
        const newListing = { ...listingData, ref, owner_id: session.user.id };
        const { error } = await supabase.from("listings").insert(newListing);
        if (error) throw error;
      }
      const successMessage = editingListingId ? "Modifications enregistrées !" : "Annonce publiée avec succès !";
      await loadListings();
      setShowForm(false);
      setEditingListingId(null);
      setForm({ title: "", cat: CATEGORIES[0].name, sub: CATEGORIES[0].subs[0], qty: "", cond: "Neuf", price: "", loc: "", departement: "", contact: "", displayName: "", description: "", photoFiles: [null, null, null], existingImageUrls: [] });
      // Confirmation visible quelques secondes : sans elle, rien à l'écran n'indique que
      // la publication a réussi (la fenêtre se ferme silencieusement), ce qui a déjà amené
      // au moins un utilisateur à recommencer tout le formulaire en pensant avoir échoué.
      showToast("success", successMessage);
    } catch (err) {
      setError("Impossible d'enregistrer l'annonce : " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteListing(id) {
    await supabase.from("listings").delete().eq("id", id);
    await loadListings();
  }

  function openEditListing(listing) {
    setEditingListingId(listing.id);
    setForm({
      title: listing.title, cat: listing.cat, sub: listing.sub,
      qty: listing.qty, cond: listing.cond, price: listing.price,
      loc: listing.loc, departement: listing.departement || "", contact: listing.contact || "",
      displayName: listing.owner_name || "",
      description: listing.description || "",
      photoFiles: [null, null, null],
      existingImageUrls: listing.image_urls || (listing.image_url ? [listing.image_url] : []),
    });
    setShowAccount(false);
    setShowForm(true);
  }

  // Petit message temporaire en haut de l'écran, pour confirmer visiblement qu'une action
  // a réussi (ou dire pourquoi elle a échoué) — sans lui, plusieurs actions se terminaient
  // silencieusement et donnaient l'impression de ne rien faire.
  function showToast(type, text, duration = 4000) {
    setToast({ type, text });
    setTimeout(() => setToast(null), duration);
  }

  // Favoris
  async function toggleFavorite(ref) {
    if (!session) { setShowLogin(true); return; }
    if (favorites.includes(ref)) {
      await supabase.from("favorites").delete().eq("user_id", session.user.id).eq("listing_ref", ref);
      setFavorites(favorites.filter((r) => r !== ref));
    } else {
      await supabase.from("favorites").insert({ user_id: session.user.id, listing_ref: ref });
      setFavorites([...favorites, ref]);
    }
  }

  // Alertes
  async function saveCurrentSearch() {
    if (!session) { setShowLogin(true); return; }
    // Le libellé doit couvrir tous les filtres qui peuvent amener à "aucun résultat" :
    // recherche texte, catégorie, ou département seul (sinon le bouton "Créer une alerte"
    // ne fait rien quand c'est le département qui filtre à vide).
    const label = searchQuery.trim() || activeCategory || activeDepartement;
    if (!label) return;
    const { data, error } = await supabase.from("saved_searches").insert({ user_id: session.user.id, query: label }).select().single();
    if (!error) {
      setSavedSearches([...savedSearches, data]);
      showToast("success", "Alerte créée !");
    } else {
      // Message d'erreur exact affiché temporairement : le bouton semblait ne "rien faire",
      // ce qui cachait jusqu'ici un éventuel échec silencieux côté Supabase (règle de sécurité,
      // contrainte...). À retirer une fois la cause identifiée et corrigée.
      showToast("error", "Alerte non créée : " + error.message);
    }
  }
  async function removeSavedSearch(id) {
    await supabase.from("saved_searches").delete().eq("id", id);
    setSavedSearches(savedSearches.filter((s) => s.id !== id));
  }
  function matchCount(label) {
    const q = normalize(label);
    return listings.filter((l) => normalize(l.title).includes(q) || normalize(l.cat).includes(q)).length;
  }

  // Messagerie
  async function openChat(listing, buyerId = null, otherNameHint = null) {
    if (!session) { setShowLogin(true); return; }
    const isOwnerViewing = listing.owner_id === session.user.id;
    const resolvedBuyerId = buyerId || (isOwnerViewing ? null : session.user.id);

    if (!resolvedBuyerId) {
      // On est le vendeur mais on ne sait pas avec quel acheteur précis discuter :
      // on ouvre la liste des conversations plutôt qu'un fil mélangé.
      setShowAccount(false);
      setShowInbox(true);
      loadConversations();
      return;
    }

    setChatFor(listing);
    setChatBuyerId(resolvedBuyerId);
    setChatOtherName(otherNameHint || (isOwnerViewing ? null : listing.owner_name));
    setChatLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("listing_ref", listing.ref)
      .eq("buyer_id", resolvedBuyerId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    if (isOwnerViewing && !otherNameHint) {
      const buyerMsg = (data || []).find((m) => m.sender_id === resolvedBuyerId);
      setChatOtherName(buyerMsg ? buyerMsg.sender_name : "Acheteur");
    }
    setChatLoading(false);
  }

  async function loadConversations() {
    if (!session) return;
    setConversationsLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });
    const byKey = new Map();
    (data || []).forEach((m) => {
      const key = `${m.listing_ref}|${m.buyer_id}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(m);
    });
    const list = Array.from(byKey.entries()).map(([key, msgs]) => {
      const last = msgs[0]; // le plus récent, car "data" est déjà trié en ordre décroissant
      const listing = listings.find((l) => l.ref === last.listing_ref);
      const buyerMsg = msgs.find((m) => m.sender_id === last.buyer_id);
      const isSeller = last.seller_id === session.user.id;
      const otherName = isSeller
        ? (buyerMsg ? buyerMsg.sender_name : "Acheteur")
        : (listing ? listing.owner_name : "Vendeur");
      return {
        key, listingRef: last.listing_ref, buyerId: last.buyer_id, sellerId: last.seller_id,
        listingTitle: listing ? listing.title : last.listing_ref,
        otherName, lastText: last.text, lastDate: last.created_at,
      };
    });
    list.sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
    setConversations(list);
    setConversationsLoading(false);
  }

  function openConversation(conv) {
    const listing = listings.find((l) => l.ref === conv.listingRef) || {
      ref: conv.listingRef, title: conv.listingTitle, owner_id: conv.sellerId,
      owner_name: conv.sellerId === session.user.id ? (profile ? profile.name : "") : conv.otherName,
    };
    setShowInbox(false);
    openChat(listing, conv.buyerId, conv.otherName);
  }

  async function sendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    if ((!messageText.trim() && !chatPhotoFile) || !chatFor || !session || !chatBuyerId) return;

    let imageUrl = null;
    if (chatPhotoFile) {
      setChatPhotoUploading(true);
      const compressedChatPhoto = await compressImage(chatPhotoFile);
      const ext = compressedChatPhoto.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("message-photos").upload(path, compressedChatPhoto, { upsert: true });
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("message-photos").getPublicUrl(path);
        imageUrl = publicUrlData.publicUrl;
      }
      setChatPhotoUploading(false);
    }

    const newMsg = {
      listing_ref: chatFor.ref,
      buyer_id: chatBuyerId,
      seller_id: chatFor.owner_id,
      sender_id: session.user.id,
      sender_name: profile ? profile.name : session.user.email,
      text: messageText.trim(),
      image_url: imageUrl,
    };
    const { data, error } = await supabase.from("messages").insert(newMsg).select().single();
    if (!error) {
      setMessages([...messages, data]);
      setMessageText("");
      setChatPhotoFile(null);
      setChatPhotoPreview(null);
      // Envoie la notification email directement, sans passer par le webhook de la base de données
      supabase.functions.invoke("hyper-task", { body: { record: data } }).catch(() => {
        // Si l'email échoue, le message reste quand même bien enregistré — on ne bloque pas l'utilisateur
      });
    }
  }

  // Avis
  async function submitReview() {
    if (!chatFor || !session || !chatFor.owner_name) return;
    setReviewSaving(true);
    const { error } = await supabase.from("reviews").insert({
      owner_name: chatFor.owner_name, rating: reviewRating, comment: reviewComment.trim(),
      from_id: session.user.id, from_name: profile ? profile.name : session.user.email,
    });
    if (!error) {
      const list = reviews[chatFor.owner_name] || [];
      setReviews({ ...reviews, [chatFor.owner_name]: [...list, { rating: reviewRating, comment: reviewComment.trim() }] });
      setReviewComment(""); setReviewRating(5);
    }
    setReviewSaving(false);
  }

  // Signalement
  async function submitReport() {
    if (!reportFor || !reportReason) return;
    const reportPayload = {
      listing_ref: reportFor.ref, title: reportFor.title, reason: reportReason,
      reporter_id: session ? session.user.id : null,
    };
    const { error } = await supabase.from("reports").insert(reportPayload);
    if (!error) {
      setReportSent(true);
      supabase.functions.invoke("notify-report", { body: { record: reportPayload } }).catch(() => {
        // Si l'email échoue, le signalement reste quand même bien enregistré — on ne bloque pas l'utilisateur
      });
    }
  }

  const selectedCatSubs = CATEGORIES.find((c) => c.name === form.cat)?.subs || [];

  return (
    <div className="min-h-screen bg-stone-200 text-stone-900 font-sans" style={{ fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" }}>
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] text-white text-sm font-semibold px-5 py-3 rounded-sm shadow-lg flex items-center gap-2 max-w-[90vw] ${toast.type === "error" ? "bg-red-700" : "bg-emerald-700"}`}>
          {toast.type === "error" ? <Flag size={16} className="shrink-0" /> : <ShieldCheck size={16} className="shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}
      <header className="bg-blue-200 text-blue-950 sticky top-0 z-30 border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-3">
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Ouvrir les catégories">
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <img src={LOGO_URL} alt="Le Castor" className="w-16 h-16 sm:w-20 sm:h-20 object-contain cursor-pointer" onClick={() => navigate("/")} />
            <span className="font-extrabold text-xl tracking-wide uppercase cursor-pointer" onClick={() => navigate("/")}>Le Castor</span>
          </div>

          <button onClick={() => navigate("/blog")} className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2 py-2 hover:text-orange-700 transition-colors shrink-0">
            <span className="hidden sm:inline">Blog</span>
            <span className="sm:hidden"><FileText size={16} /></span>
          </button>

          <div className="flex-1 max-w-xl relative hidden sm:flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un matériau, une référence…"
                className="w-full bg-white border border-blue-200 text-stone-900 placeholder-stone-500 text-sm rounded-sm pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {(searchQuery.trim() || activeCategory) && (
              <button onClick={saveCurrentSearch} title="Créer une alerte" className="shrink-0 p-2 rounded-sm hover:bg-blue-900 transition-colors">
                <Star size={16} />
              </button>
            )}
          </div>

          {!authLoading && session && (
            <button onClick={() => setShowAccount(true)} className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2 py-2 hover:text-orange-700 transition-colors shrink-0">
              <span className="hidden sm:inline">Mon compte</span>
              <span className="sm:hidden"><User size={16} /></span>
            </button>
          )}
          {!authLoading && !session && (
            <button onClick={() => { track("Ouverture formulaire connexion"); setAuthMode("signin"); setShowLogin(true); }} className="ml-auto flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2 py-2 hover:text-orange-700 transition-colors shrink-0">
              <User size={16} /><span>Se connecter</span>
            </button>
          )}

          <button onClick={() => { if (!session) { setShowLogin(true); } else { setShowForm(true); } }} className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 transition-colors text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-2 rounded-sm shrink-0 whitespace-nowrap">
            <Plus size={16} /><span>Déposer</span>
          </button>
        </div>

        <div className="bg-blue-900 text-blue-200 text-xs px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
          <span>Catalogue matériaux &amp; matériel BTP — nouvelles annonces chaque jour</span>
          <button onClick={() => { if (!session) { setShowLogin(true); } else { setShowForm(true); } }} className="text-amber-400 font-semibold underline underline-offset-2 whitespace-nowrap">
            + Déposer une annonce
          </button>
        </div>
      </header>

      {page === "home" && (
      <>
      <div className="bg-emerald-800 text-emerald-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 shrink-0">
            <Leaf size={18} className="text-emerald-300" />
            <Recycle size={18} className="text-emerald-300" />
          </div>
          <p className="text-xs sm:text-sm font-semibold">
            Ne jetez plus. Ne stockez plus. <span className="text-amber-300">VENDEZ</span> avec Le Castor — donnez une seconde vie à vos surplus de chantier.
          </p>
        </div>
      </div>

      {showContestBanner && (
        <div className="bg-amber-50 border-y border-amber-300 text-amber-900 text-xs sm:text-sm px-4 py-2.5 text-center flex items-center justify-center gap-2">
          <button
            onClick={() => { if (!session) { setShowLogin(true); } else { setShowForm(true); } }}
            className="hover:underline"
          >
            🎁 <strong>Jeu concours</strong> — dépose une annonce et tente de gagner un télémètre laser Hilti PD-S (valeur 200€), parmi les 100 premiers participants !
          </button>
          <button onClick={() => setShowContestBanner(false)} aria-label="Fermer" className="shrink-0 text-amber-700 hover:text-amber-900">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex">
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-72 shrink-0 bg-stone-50 lg:min-h-screen border-r border-stone-300`}>
          <nav className="p-2">
            <button onClick={() => { setActiveCategory(null); setActiveSubCategory(null); setSidebarOpen(false); }} className={`w-full text-left px-3 py-2 mb-1 text-sm font-semibold rounded-sm ${!activeCategory ? "bg-amber-500 text-stone-900" : "hover:bg-stone-200"}`}>
              Toutes les catégories
            </button>
            {CATEGORIES.map((cat) => (
              <div key={cat.code} className="mb-1">
                <button onClick={() => { setActiveCategory(cat.name); setActiveSubCategory(null); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-sm transition-colors ${activeCategory === cat.name ? "bg-amber-500 text-stone-900" : "hover:bg-stone-200 text-stone-900"}`}>
                  <cat.icon size={16} className={activeCategory === cat.name ? "text-stone-900" : "text-orange-700"} />
                  {cat.name}
                  <span className="font-mono text-xs opacity-50">{cat.code}</span>
                  <ChevronRight size={14} className="ml-auto opacity-50" />
                </button>
                {activeCategory === cat.name && (
                  <ul className="ml-9 mt-1 mb-2 border-l border-stone-300 pl-3 space-y-1">
                    {cat.subs.map((s) => (
                      <li key={s}>
                        <button onClick={() => { setActiveSubCategory(activeSubCategory === s ? null : s); setSidebarOpen(false); }} className={`text-xs py-0.5 text-left w-full ${activeSubCategory === s ? "text-orange-700 font-semibold" : "text-stone-600 hover:text-stone-900"}`}>
                          {s}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button onClick={() => setSidebarOpen(false)} className="lg:hidden mt-1 text-xs font-semibold text-white bg-orange-700 hover:bg-orange-800 rounded-sm px-2.5 py-1.5 w-full text-center">
                        Voir les annonces
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6">
          <div className="sm:hidden relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un matériau…" className="w-full bg-stone-50 border border-stone-300 text-stone-900 placeholder-stone-500 text-sm rounded-sm pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-sm border ${showFavoritesOnly ? "bg-orange-700 text-white border-orange-700" : "bg-stone-50 border-stone-300 text-stone-700"}`}>
              <Heart size={13} fill={showFavoritesOnly ? "currentColor" : "none"} />
              Mes favoris {favorites.length > 0 && `(${favorites.length})`}
            </button>
            <select value={activeDepartement} onChange={(e) => setActiveDepartement(e.target.value)} className="text-xs border border-stone-300 rounded-sm px-2 py-1.5 bg-stone-50 outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Tous les départements</option>
              {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs border border-stone-300 rounded-sm px-2 py-1.5 bg-stone-50 outline-none focus:ring-2 focus:ring-amber-500">
              <option value="recent">Plus récentes</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

          <div className="flex items-baseline justify-between mb-4">
            <h1 className="font-extrabold uppercase text-2xl tracking-wide">{activeCategory || "Toutes les annonces"}</h1>
            <span className="text-xs font-mono text-stone-500">{loading ? "Chargement…" : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-stone-500"><Loader2 className="animate-spin mr-2" size={18} /> Chargement des annonces…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-stone-500">
              {searchQuery.trim() || activeCategory || activeDepartement ? (
                // Le catalogue est encore petit : une recherche/filtre qui ne donne rien est
                // fréquent au démarrage. Plutôt qu'un mur vide qui pousse à partir, on propose
                // tout de suite l'alerte (déjà existante) pour transformer ce moment en visiteur
                // qui reviendra, au lieu de le perdre.
                <>
                  <p className="text-sm mb-1">Aucune annonce ne correspond pour l'instant.</p>
                  <p className="text-xs text-stone-400 mb-4 max-w-xs mx-auto">Le catalogue grandit chaque jour — crée une alerte et on te préviendra dès qu'une annonce correspond à ta recherche.</p>
                  <button onClick={saveCurrentSearch} className="flex items-center gap-1.5 mx-auto bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold px-3 py-2 rounded-sm transition-colors">
                    <Star size={13} />Créer une alerte
                  </button>
                  {(activeCategory || activeDepartement) && (
                    <button onClick={() => { setActiveCategory(null); setActiveSubCategory(null); setActiveDepartement(""); setSearchQuery(""); }} className="mt-3 text-xs text-stone-500 underline block mx-auto">
                      Voir toutes les annonces à la place
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm">Aucune annonce dans cette catégorie pour l'instant.</p>
                  <button onClick={() => { if (!session) { setShowLogin(true); } else { setShowForm(true); } }} className="mt-3 text-sm font-semibold text-orange-700 underline">Sois le premier à en déposer une</button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const rating = ownerRating(item.owner_name);
                const photos = (item.image_urls && item.image_urls.length ? item.image_urls : [item.image_url]).filter(Boolean);
                const idx = photoIndex[item.id] || 0;
                const currentPhoto = photos[idx] || null;
                return (
                  <div key={item.id} className="bg-stone-50 border border-stone-300 rounded-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col relative">
                    <div
                      className="aspect-[4/3] bg-stone-100 flex items-center justify-center overflow-hidden relative cursor-pointer"
                      onClick={() => { setDetailFor(item); setDetailPhotoIndex(idx); track("Annonce consultee", { ref: item.ref, categorie: item.cat }); }}
                    >
                      {currentPhoto ? (
                        <img src={currentPhoto} alt={item.title} loading="lazy" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                      ) : null}
                      <div className={`w-full h-full items-center justify-center ${currentPhoto ? "hidden" : "flex"}`}><Hammer size={28} className="text-stone-400" /></div>
                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPhotoIndex({ ...photoIndex, [item.id]: (idx - 1 + photos.length) % photos.length }); }}
                            aria-label="Photo précédente"
                            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPhotoIndex({ ...photoIndex, [item.id]: (idx + 1) % photos.length }); }}
                            aria-label="Photo suivante"
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </>
                      )}
                      {photos.length > 1 && (
                        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
                          {photos.map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => { e.stopPropagation(); setPhotoIndex({ ...photoIndex, [item.id]: i }); }}
                              aria-label={`Photo ${i + 1}`}
                              className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`}
                            />
                          ))}
                        </div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.ref); }} aria-label="Ajouter aux favoris" className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow">
                        <Heart size={15} className={favorites.includes(item.ref) ? "text-orange-700" : "text-stone-400"} fill={favorites.includes(item.ref) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-orange-700 font-semibold">{item.ref}</span>
                        <span className="text-xs uppercase tracking-wide text-stone-500 flex items-center gap-1">
                          {React.createElement(categoryIcon(item.cat), { size: 12 })}
                          {item.cat}
                        </span>
                      </div>
                      <h3
                        className="text-sm font-semibold leading-snug cursor-pointer hover:text-orange-700"
                        onClick={() => { setDetailFor(item); setDetailPhotoIndex(idx); track("Annonce consultee", { ref: item.ref, categorie: item.cat }); }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600">{item.qty} · {item.cond}</p>
                      {item.description && <p className="text-xs text-stone-500 line-clamp-2">{item.description}</p>}
                      {item.owner_name && (
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                          Déposé par {item.owner_name}
                          {rating && <span className="flex items-center gap-0.5 text-amber-600"><Star size={11} fill="currentColor" /> {rating.avg.toFixed(1)} ({rating.count})</span>}
                        </p>
                      )}
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-stone-600"><MapPin size={12} />{item.loc}</span>
                        <span className="font-extrabold text-lg text-stone-900">{item.price}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { track("Bouton Contacter clique", { ref: item.ref, source: "carte", ...utmProps() }); if (window.fbq) window.fbq("track", "Contact"); openChat(item); }} className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 text-stone-100 text-xs font-semibold py-2 rounded-sm hover:bg-stone-950 transition-colors">
                          <MessageSquare size={13} />Contacter
                        </button>
                        <button onClick={() => { setReportFor(item); setReportReason(""); setReportSent(false); }} aria-label="Signaler" className="px-2.5 py-2 rounded-sm border border-stone-300 text-stone-500 hover:text-orange-700 hover:border-orange-700 transition-colors">
                          <Flag size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => { setShowLogin(false); setSignupDone(false); }}>
          <div className="bg-stone-50 rounded-sm max-w-sm w-full p-5 mt-10 sm:mt-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {signupDone ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold uppercase text-lg">Vérifie ta boîte mail</h2>
                  <button onClick={() => { setShowLogin(false); setSignupDone(false); }} aria-label="Fermer"><X size={20} /></button>
                </div>
                <p className="text-sm text-stone-700 mb-2">
                  Ton compte est créé ! Un email de confirmation vient de t'être envoyé.
                </p>
                <p className="text-sm text-stone-700">
                  Clique sur le lien qu'il contient pour activer ton compte, puis reviens ici et connecte-toi.
                </p>
                <p className="text-xs text-stone-500 mt-2 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                  📬 Tu ne le vois pas dans quelques minutes ? Pense à vérifier tes <strong>spams / courriers indésirables</strong> — c'est souvent là qu'il atterrit au premier envoi.
                </p>
                <button type="button" onClick={() => { setShowLogin(false); setSignupDone(false); }} className="mt-4 w-full bg-stone-900 text-white text-sm font-semibold py-3 rounded-sm">
                  Compris
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold uppercase text-lg">{authMode === "signup" ? "Créer un compte" : "Se connecter"}</h2>
                  <button onClick={() => setShowLogin(false)} aria-label="Fermer"><X size={20} /></button>
                </div>
                <div className="flex flex-col gap-3">
                  {authMode === "signup" && (
                    <label className="text-xs font-semibold">
                      Nom / entreprise
                      <input type="text" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Ex : Jean" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                    </label>
                  )}
                  <label className="text-xs font-semibold">
                    Email
                    <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="toi@exemple.fr" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                  </label>
                  <label className="text-xs font-semibold">
                    Mot de passe
                    <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="6 caractères minimum" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                  </label>
                  {authError && <p className="text-xs text-orange-700 font-semibold">{authError}</p>}
                  <button type="button" onClick={handleAuth} disabled={authSubmitting} className="mt-2 w-full flex items-center justify-center gap-2 bg-orange-700 hover:bg-orange-800 active:bg-orange-900 transition-colors text-white text-sm font-semibold py-3 rounded-sm disabled:opacity-60">
                    {authSubmitting && <Loader2 className="animate-spin" size={14} />}
                    {authMode === "signup" ? "Créer mon compte" : "Me connecter"}
                  </button>
                  <button type="button" onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setAuthError(""); }} className="text-xs text-stone-500 underline">
                    {authMode === "signup" ? "J'ai déjà un compte" : "Pas encore de compte ? Crée-en un"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showForm && session && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-stone-50 rounded-sm max-w-md w-full max-h-[100dvh] overflow-y-auto mt-10 sm:mt-0 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
              <h2 className="font-extrabold uppercase text-lg">{editingListingId ? "Modifier l'annonce" : "Déposer une annonce"}</h2>
              <button onClick={() => { setShowForm(false); setEditingListingId(null); setForm({ title: "", cat: CATEGORIES[0].name, sub: CATEGORIES[0].subs[0], qty: "", cond: "Neuf", price: "", loc: "", departement: "", contact: "", displayName: "", description: "", photoFiles: [null, null, null], existingImageUrls: [] }); }} aria-label="Fermer"><X size={20} /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <label className="text-xs font-semibold">Titre de l'annonce
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Palette de parpaings 20x20x50" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold">Catégorie
                  <select value={form.cat} onChange={(e) => { const cat = e.target.value; const subs = CATEGORIES.find((c) => c.name === cat)?.subs || []; setForm({ ...form, cat, sub: subs[0] || "" }); }} className="mt-1 w-full border border-stone-300 rounded-sm px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500">
                    {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">Sous-catégorie
                  <select value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} className="mt-1 w-full border border-stone-300 rounded-sm px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500">
                    {selectedCatSubs.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold">Quantité
                  <input type="text" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="Ex : 22 m²" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                </label>
                <label className="text-xs font-semibold">État
                  <select value={form.cond} onChange={(e) => setForm({ ...form, cond: e.target.value })} className="mt-1 w-full border border-stone-300 rounded-sm px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500">
                    <option>Neuf</option><option>Surplus chantier</option><option>Chute de chantier</option><option>Bon état</option><option>Léger défaut d'aspect</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold">Prix
                  <input type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Ex : 45 (le € s'ajoute tout seul) ou à débattre" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                </label>
                <label className="text-xs font-semibold">Localisation
                  <input type="text" value={form.loc} onChange={(e) => setForm({ ...form, loc: e.target.value })} placeholder="Ex : Lyon 8e" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                </label>
              </div>
              <label className="text-xs font-semibold">Département
                <select value={form.departement} onChange={(e) => setForm({ ...form, departement: e.target.value })} className="mt-1 w-full border border-stone-300 rounded-sm px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">Sélectionner…</option>
                  {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <span className="block mt-1 text-xs text-stone-500 font-normal">Permet aux acheteurs de filtrer les annonces près de chez eux.</span>
              </label>
              <label className="text-xs font-semibold">Description (optionnel)
                <textarea
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décris ton annonce : dimensions, état précis, pourquoi tu t'en sépares…"
                  rows={4}
                  className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </label>
              <label className="text-xs font-semibold">Photos (jusqu'à 3, optionnel)
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <label key={i} className="flex flex-col items-center justify-center gap-1 border border-dashed border-stone-300 rounded-sm h-20 cursor-pointer hover:border-amber-500 transition-colors overflow-hidden relative">
                      {form.photoFiles[i] ? (
                        <img src={URL.createObjectURL(form.photoFiles[i])} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Plus size={16} className="text-stone-400" />
                          <span className="text-[10px] text-stone-400">Photo {i + 1}</span>
                        </>
                      )}
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0] || null;
                          const updated = [...form.photoFiles];
                          updated[i] = file;
                          setForm({ ...form, photoFiles: updated });
                        }}
                      />
                    </label>
                  ))}
                </div>
              </label>
              <label className="text-xs font-semibold">Nom affiché sur l'annonce (optionnel)
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder={profile ? profile.name : "Membre Le Castor"}
                  className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="block mt-1 text-xs text-stone-500 font-normal">Par défaut, ton nom de profil est utilisé. Mets un pseudo si tu préfères rester discret — ton email/téléphone ne sont jamais affichés publiquement.</span>
              </label>
              <label className="text-xs font-semibold">Contact (email ou téléphone)
                <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Ex : jean@exemple.fr ou 06 12 34 56 78" className="mt-1 w-full border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                <span className="block mt-1 text-xs text-stone-500 font-normal">Utilisé uniquement en interne, jamais affiché sur l'annonce.</span>
              </label>
              {error && <p className="text-xs text-orange-700 font-semibold">{error}</p>}
              <button type="button" onClick={handleSubmit} disabled={saving} className="mt-2 w-full flex items-center justify-center gap-2 bg-orange-700 hover:bg-orange-800 active:bg-orange-900 transition-colors text-white text-sm font-semibold py-3 rounded-sm disabled:opacity-60">
                {saving && <Loader2 className="animate-spin" size={14} />}{editingListingId ? "Enregistrer les modifications" : "Publier l'annonce"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccount && session && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowAccount(false)}>
          <div className="bg-stone-50 rounded-sm max-w-md w-full max-h-[100dvh] overflow-y-auto mt-10 sm:mt-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
              <h2 className="font-extrabold uppercase text-lg">Mon compte</h2>
              <button onClick={() => setShowAccount(false)} aria-label="Fermer"><X size={20} /></button>
            </div>
            <div className="p-5 flex flex-col gap-5">
              <div>
                <p className="text-sm font-semibold">{profile ? profile.name : "…"}</p>
                <p className="text-xs text-stone-500">{session.user.email}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-stone-500 mb-2">Messagerie</h3>
                <button
                  onClick={() => { setShowAccount(false); setShowInbox(true); loadConversations(); }}
                  className="w-full flex items-center justify-center gap-1.5 bg-stone-900 text-stone-100 text-xs font-semibold py-2 rounded-sm hover:bg-stone-950 transition-colors"
                >
                  <MessageSquare size={14} />Voir mes conversations
                </button>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-stone-500 mb-2">Mes annonces</h3>
                {listings.filter((l) => l.owner_id === session.user.id).length === 0 ? (
                  <p className="text-xs text-stone-500">Tu n'as pas encore déposé d'annonce.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {listings.filter((l) => l.owner_id === session.user.id).map((l) => (
                      <li key={l.id} className="flex items-center justify-between text-xs bg-stone-100 rounded-sm px-3 py-2">
                        <span className="truncate">{l.title} · {l.price}</span>
                        <span className="flex items-center gap-2 shrink-0 ml-2">
                          <button onClick={() => openEditListing(l)} className="text-stone-400 hover:text-orange-700" aria-label="Modifier">Modifier</button>
                          <button onClick={() => deleteListing(l.id)} className="text-stone-400 hover:text-orange-700" aria-label="Supprimer"><Trash2 size={14} /></button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-stone-500 mb-2">Mes alertes de recherche</h3>
                {savedSearches.length === 0 ? (
                  <p className="text-xs text-stone-500">Aucune alerte. Utilise l'étoile à côté de la recherche pour en créer une.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {savedSearches.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-xs bg-stone-100 rounded-sm px-3 py-2">
                        <span>"{s.query}" — {matchCount(s.query)} annonce(s)</span>
                        <button onClick={() => removeSavedSearch(s.id)} className="text-stone-400 hover:text-orange-700 shrink-0 ml-2" aria-label="Supprimer"><Trash2 size={14} /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={handleLogout} className="text-xs font-semibold text-stone-500 underline self-start">Se déconnecter</button>
            </div>
          </div>
        </div>
      )}

      {detailFor && (() => {
        const item = detailFor;
        const rating = ownerRating(item.owner_name);
        const photos = (item.image_urls && item.image_urls.length ? item.image_urls : [item.image_url]).filter(Boolean);
        const currentPhoto = photos[detailPhotoIndex] || null;
        return (
          <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-40 overflow-y-auto" onClick={() => setDetailFor(null)}>
            <div className="bg-stone-50 rounded-sm max-w-lg w-full max-h-[100dvh] overflow-y-auto mt-10 sm:mt-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <div className="h-80 bg-stone-100 flex items-center justify-center overflow-hidden">
                  {currentPhoto ? (
                    <img src={currentPhoto} alt={item.title} loading="lazy" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <div className={`w-full h-full items-center justify-center ${currentPhoto ? "hidden" : "flex"}`}><Hammer size={40} className="text-stone-400" /></div>
                </div>
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setDetailPhotoIndex((detailPhotoIndex - 1 + photos.length) % photos.length)}
                      aria-label="Photo précédente"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setDetailPhotoIndex((detailPhotoIndex + 1) % photos.length)}
                      aria-label="Photo suivante"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                {photos.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setDetailPhotoIndex(i)}
                        aria-label={`Photo ${i + 1}`}
                        className={`w-2 h-2 rounded-full ${i === detailPhotoIndex ? "bg-white" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                )}
                <button onClick={() => setDetailFor(null)} aria-label="Fermer" className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow"><X size={18} /></button>
                <button onClick={() => toggleFavorite(item.ref)} aria-label="Ajouter aux favoris" className="absolute top-2 left-2 bg-white/90 rounded-full p-1.5 shadow">
                  <Heart size={16} className={favorites.includes(item.ref) ? "text-orange-700" : "text-stone-400"} fill={favorites.includes(item.ref) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-orange-700 font-semibold">{item.ref}</span>
                  <span className="text-xs uppercase tracking-wide text-stone-500 flex items-center gap-1">
                    {React.createElement(categoryIcon(item.cat), { size: 12 })}
                    {item.cat}{item.sub ? ` · ${item.sub}` : ""}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold leading-snug">{item.title}</h2>
                <p className="text-sm text-stone-600">{item.qty} · {item.cond}</p>
                {item.description && <p className="text-sm text-stone-700 whitespace-pre-wrap">{item.description}</p>}
                {item.owner_name && (
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    Déposé par {item.owner_name}
                    {rating && <span className="flex items-center gap-0.5 text-amber-600"><Star size={12} fill="currentColor" /> {rating.avg.toFixed(1)} ({rating.count})</span>}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="flex items-center gap-1 text-sm text-stone-600"><MapPin size={14} />{item.loc}</span>
                  <span className="font-extrabold text-2xl text-stone-900">{item.price}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { track("Bouton Contacter clique", { ref: item.ref, source: "detail", ...utmProps() }); if (window.fbq) window.fbq("track", "Contact"); setDetailFor(null); openChat(item); }} className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 text-stone-100 text-sm font-semibold py-2.5 rounded-sm hover:bg-stone-950 transition-colors">
                    <MessageSquare size={15} />Contacter
                  </button>
                  <button onClick={() => { setDetailFor(null); setReportFor(item); setReportReason(""); setReportSent(false); }} aria-label="Signaler" className="px-3 py-2.5 rounded-sm border border-stone-300 text-stone-500 hover:text-orange-700 hover:border-orange-700 transition-colors">
                    <Flag size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {reportFor && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setReportFor(null)}>
          <div className="bg-stone-50 rounded-sm max-w-sm w-full p-5 mt-10 sm:mt-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold uppercase text-lg">Signaler l'annonce</h2>
              <button onClick={() => setReportFor(null)} aria-label="Fermer"><X size={20} /></button>
            </div>
            <p className="text-xs text-stone-500 mb-4">{reportFor.title}</p>
            {reportSent ? (
              <p className="text-sm text-orange-700 font-semibold">Signalement envoyé, merci !</p>
            ) : (
              <div className="flex flex-col gap-3">
                {["Annonce frauduleuse / arnaque", "Contenu inapproprié", "Prix ou description trompeurs", "Annonce en double", "Autre raison"].map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="reportReason" checked={reportReason === reason} onChange={() => setReportReason(reason)} />{reason}
                  </label>
                ))}
                <button type="button" onClick={submitReport} disabled={!reportReason} className="mt-2 w-full bg-orange-700 hover:bg-orange-800 active:bg-orange-900 transition-colors text-white text-sm font-semibold py-3 rounded-sm disabled:opacity-50">Envoyer le signalement</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showLegal && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowLegal(null)}>
          <div className="bg-stone-50 rounded-sm max-w-lg w-full max-h-[100dvh] overflow-y-auto mt-10 sm:mt-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
              <h2 className="font-extrabold uppercase text-lg">
                {showLegal === "cgu" && "Conditions générales d'utilisation"}
                {showLegal === "mentions" && "Mentions légales"}
                {showLegal === "confidentialite" && "Politique de confidentialité"}
              </h2>
              <button onClick={() => setShowLegal(null)} aria-label="Fermer"><X size={20} /></button>
            </div>
            <div className="p-5 text-xs text-stone-600 leading-relaxed flex flex-col gap-3">
              <p className="bg-amber-100 border border-amber-300 text-amber-800 rounded-sm px-3 py-2 font-semibold">
                Texte de démonstration — à faire rédiger par un professionnel avant le vrai lancement public.
              </p>
              {showLegal === "cgu" && <p>Ces conditions définiraient les règles d'usage : qui peut déposer une annonce, ce qui est interdit, les responsabilités entre acheteur et vendeur.</p>}
              {showLegal === "mentions" && <p>Les mentions légales indiqueraient l'éditeur (nom, adresse, SIRET), l'hébergeur, et les coordonnées de contact.</p>}
              {showLegal === "confidentialite" && <p>La politique de confidentialité expliquerait quelles données sont collectées, pourquoi, et comment exercer ses droits RGPD.</p>}
            </div>
          </div>
        </div>
      )}

      {chatFor && session && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-40 overflow-y-auto" onClick={() => { setChatFor(null); setChatBuyerId(null); setChatOtherName(null); setChatPhotoFile(null); setChatPhotoPreview(null); }}>
          <div className="bg-stone-50 rounded-sm max-w-sm w-full max-h-[100dvh] flex flex-col mt-10 sm:mt-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-300">
              <div>
                <h2 className="font-extrabold uppercase text-sm leading-tight">{chatFor.title}</h2>
                <p className="text-xs text-stone-500 font-mono">{chatFor.ref} · avec {chatOtherName || "membre"}</p>
              </div>
              <button onClick={() => { setChatFor(null); setChatBuyerId(null); setChatOtherName(null); setChatPhotoFile(null); setChatPhotoPreview(null); }} aria-label="Fermer"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-stone-200 min-h-[16rem]">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full text-stone-500 text-sm"><Loader2 className="animate-spin mr-2" size={16} /> Chargement…</div>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-stone-500 mt-8">Aucun message pour l'instant. Dis bonjour à {chatOtherName || "cette personne"} !</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded-sm text-sm ${m.sender_id === session.user.id ? "self-end bg-amber-500 text-stone-900" : "self-start bg-stone-50 border border-stone-300"}`}>
                    {m.image_url && (
                      <img src={m.image_url} alt="Photo jointe" loading="lazy" className="rounded-sm mb-1.5 max-h-48 w-full object-cover cursor-pointer" onClick={() => window.open(m.image_url, "_blank")} />
                    )}
                    {m.text && <p>{m.text}</p>}
                    <p className="text-xs opacity-60 mt-1">{m.sender_name} · {new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-stone-300 flex flex-col gap-2">
              {chatPhotoPreview && (
                <div className="relative w-fit">
                  <img src={chatPhotoPreview} alt="Aperçu" className="h-16 rounded-sm border border-stone-300" />
                  <button type="button" onClick={() => { setChatPhotoFile(null); setChatPhotoPreview(null); }} aria-label="Retirer la photo" className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white rounded-full p-0.5"><X size={12} /></button>
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex items-center justify-center border border-stone-300 rounded-sm px-2.5 cursor-pointer hover:bg-stone-100 transition-colors">
                  <Paperclip size={16} className="text-stone-600" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      setChatPhotoFile(file);
                      setChatPhotoPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
                <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Écris ton message…" className="flex-1 border border-stone-300 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                <button type="button" onClick={sendMessage} disabled={chatPhotoUploading} className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900 transition-colors text-white p-2 rounded-sm disabled:opacity-60">
                  {chatPhotoUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
            {chatOtherName && chatOtherName !== (profile ? profile.name : "") && (
              <div className="p-3 border-t border-stone-300 bg-stone-100">
                <p className="text-xs font-semibold mb-1.5">Laisser un avis sur {chatOtherName}</p>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReviewRating(n)} aria-label={`${n} étoiles`}>
                      <Star size={18} className={n <= reviewRating ? "text-amber-500" : "text-stone-300"} fill={n <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Commentaire (optionnel)" className="flex-1 border border-stone-300 rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                  <button type="button" onClick={submitReview} disabled={reviewSaving} className="text-xs font-semibold bg-stone-900 text-white px-3 py-1.5 rounded-sm disabled:opacity-60">Publier</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showInbox && session && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 z-40 overflow-y-auto" onClick={() => setShowInbox(false)}>
          <div className="bg-stone-50 rounded-sm max-w-md w-full max-h-[100dvh] overflow-y-auto mt-10 sm:mt-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
              <h2 className="font-extrabold uppercase text-lg">Messagerie</h2>
              <button onClick={() => setShowInbox(false)} aria-label="Fermer"><X size={20} /></button>
            </div>
            <div className="p-5">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8 text-stone-500 text-sm"><Loader2 className="animate-spin mr-2" size={16} /> Chargement…</div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">Aucune conversation pour l'instant.</p>
              ) : (() => {
                // Regroupe les conversations par annonce pour s'y retrouver plus facilement
                const groups = [];
                const groupByRef = new Map();
                for (const conv of conversations) {
                  if (!groupByRef.has(conv.listingRef)) {
                    const group = { listingRef: conv.listingRef, listingTitle: conv.listingTitle, items: [] };
                    groupByRef.set(conv.listingRef, group);
                    groups.push(group);
                  }
                  groupByRef.get(conv.listingRef).items.push(conv);
                }
                // Les groupes gardent l'ordre du plus récent au plus ancien (conversations déjà triées ainsi)
                return (
                  <div className="flex flex-col gap-5">
                    {groups.map((group) => (
                      <div key={group.listingRef}>
                        <div className="flex items-center gap-2 mb-2 px-0.5">
                          <span className="text-xs font-mono text-orange-700 font-semibold shrink-0">{group.listingRef}</span>
                          <span className="text-xs font-semibold text-stone-700 truncate">{group.listingTitle}</span>
                          <span className="text-xs text-stone-400 shrink-0">· {group.items.length} conv.</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          {group.items.map((conv) => (
                            <li key={conv.key}>
                              <button onClick={() => openConversation(conv)} className="w-full text-left bg-stone-100 hover:bg-stone-200 transition-colors rounded-sm px-3 py-2.5 flex items-start gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-orange-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                  {(conv.otherName || "?").trim().charAt(0).toUpperCase()}
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="flex items-center justify-between">
                                    <span className="text-sm font-semibold truncate">{conv.otherName}</span>
                                    <span className="text-xs text-stone-500 shrink-0 ml-2">{new Date(conv.lastDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</span>
                                  </span>
                                  <span className="block text-xs text-stone-600 truncate mt-0.5">{conv.lastText}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {page === "blog" && (
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="font-extrabold uppercase text-3xl tracking-wide mb-2">Le blog du Castor</h1>
          <p className="text-stone-600 mb-8">Conseils, astuces et actus autour des matériaux et matériel de BTP.</p>
          <div className="flex flex-col gap-6">
            {ARTICLES.map((article) => (
              <button
                key={article.slug}
                onClick={() => navigate(`/blog/${article.slug}`)}
                className="text-left bg-stone-50 border border-stone-300 rounded-sm p-5 hover:shadow-md transition-shadow"
              >
                <p className="text-xs text-stone-500 mb-1">{new Date(article.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                <h2 className="text-lg font-bold mb-2">{article.title}</h2>
                <p className="text-sm text-stone-600">{article.excerpt}</p>
                <span className="text-sm text-orange-700 font-semibold mt-2 inline-block">Lire l'article →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {page.startsWith("blog/") && (() => {
        const slug = page.replace("blog/", "");
        const article = ARTICLES.find((a) => a.slug === slug);
        if (!article) {
          return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
              <p className="text-stone-600 mb-4">Cet article n'existe pas ou n'est plus disponible.</p>
              <button onClick={() => navigate("/blog")} className="text-orange-700 font-semibold">← Retour au blog</button>
            </div>
          );
        }
        return (
          <article className="max-w-2xl mx-auto px-4 py-10">
            <button onClick={() => navigate("/blog")} className="text-sm text-stone-500 hover:text-orange-700 mb-6 inline-block">← Retour au blog</button>
            <p className="text-xs text-stone-500 mb-2">{new Date(article.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <h1 className="font-extrabold text-3xl mb-6 leading-tight">{article.title}</h1>
            <div className="flex flex-col gap-4">
              {article.content.map((block, i) =>
                block.type === "h2" ? (
                  <h2 key={i} className="text-xl font-bold mt-4">{block.text}</h2>
                ) : (
                  <p key={i} className="text-stone-700 leading-relaxed">{block.text}</p>
                )
              )}
            </div>
            <div className="mt-10 p-5 bg-amber-50 border border-amber-300 rounded-sm text-center">
              <p className="text-sm text-amber-900 mb-3">Ne jetez plus. Ne stockez plus. Vendez avec Le Castor.</p>
              <button onClick={() => navigate("/")} className="bg-orange-700 hover:bg-orange-800 text-white text-sm font-semibold px-5 py-2.5 rounded-sm">Voir les annonces</button>
            </div>
          </article>
        );
      })()}

      <footer className="bg-stone-900 text-stone-400 text-xs px-4 py-4 mt-6 flex flex-wrap gap-x-4 gap-y-1 justify-center">
        <button onClick={() => setShowLegal("cgu")} className="hover:text-white flex items-center gap-1"><FileText size={12} /> CGU</button>
        <button onClick={() => setShowLegal("mentions")} className="hover:text-white flex items-center gap-1"><FileText size={12} /> Mentions légales</button>
        <button onClick={() => setShowLegal("confidentialite")} className="hover:text-white flex items-center gap-1"><ShieldCheck size={12} /> Confidentialité</button>
      </footer>
    </div>
  );
}
