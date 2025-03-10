
const app = Vue.createApp({
    data() {
        return {
            pieces: [
                {
                    "id": 1,
                    "nom": "Batterie 12V",
                    "prix": 120,
                    "categorie": "Électricité",
                    "Image": "image_batterie_12v.jpg",
                    "Disponible": true
                },
                {
                    "id": 2,
                    "nom": "Filtre à huile",
                    "prix": 15,
                    "categorie": "Filtration",
                    "Image": "image_filtre_huile.jpg",
                    "Disponible": true
                },
                {
                    "id": 3,
                    "nom": "Bougies d'allumage (x4)",
                    "prix": 35,
                    "categorie": "Moteur",
                    "Image": "image_bougies_allumage.jpg",
                    "Disponible": false
                },
                {
                    "id": 4,
                    "nom": "Disques de frein (x2)",
                    "prix": 80,
                    "categorie": "Freinage",
                    "Image": "image_disques_frein.jpg",
                    "Disponible": true
                },
                {
                    "id": 5,
                    "nom": "Courroie de distribution",
                    "prix": 90,
                    "categorie": "Moteur",
                    "Image": "image_courroie_distribution.jpg",
                    "Disponible": false
                },
                {
                    "id": 6,
                    "nom": "Pompe à eau",
                    "prix": 70,
                    "categorie": "Refroidissement",
                    "Image": "image_pompe_eau.jpg",
                    "Disponible": true
                },
                {
                    "id": 7,
                    "nom": "Amortisseurs arrière (x2)",
                    "prix": 150,
                    "categorie": "Suspension",
                    "Image": "image_amortisseurs_arriere.jpg",
                    "Disponible": true
                },
                {
                    "id": 8,
                    "nom": "Filtre à air",
                    "prix": 20,
                    "categorie": "Filtration",
                    "Image": "image_filtre_air.jpg",
                    "Disponible": true
                },
                {
                    "id": 9,
                    "nom": "Capteur ABS",
                    "prix": 50,
                    "categorie": "Sécurité",
                    "Image": "image_capteur_abs.jpg",
                    "Disponible": false
                },
                {
                    "id": 10,
                    "nom": "Radiateur de refroidissement",
                    "prix": 130,
                    "categorie": "Refroidissement",
                    "Image": "image_radiateur_refroidissement.jpg",
                    "Disponible": true
                },
                {
                    "id": 11,
                    "nom": "Alternateur",
                    "prix": 200,
                    "categorie": "Électricité",
                    "Image": "image_alternateur.jpg",
                    "Disponible": true
                },
                {
                    "id": 12,
                    "nom": "Démarreur",
                    "prix": 180,
                    "categorie": "Électricité",
                    "Image": "image_demarreur.jpg",
                    "Disponible": false
                },
                {
                    "id": 13,
                    "nom": "Kit d’embrayage",
                    "prix": 220,
                    "categorie": "Transmission",
                    "Image": "image_kit_embrayage.jpg",
                    "Disponible": true
                },
                {
                    "id": 14,
                    "nom": "Injecteur de carburant",
                    "prix": 110,
                    "categorie": "Moteur",
                    "Image": "image_injecteur_carburant.jpg",
                    "Disponible": true
                },
                {
                    "id": 15,
                    "nom": "Pompe à carburant",
                    "prix": 90,
                    "categorie": "Carburant",
                    "Image": "image_pompe_carburant.jpg",
                    "Disponible": true
                },
                {
                    "id": 16,
                    "nom": "Capteur de pression des pneus (TPMS)",
                    "prix": 45,
                    "categorie": "Sécurité",
                    "Image": "image_capteur_tpms.jpg",
                    "Disponible": true
                },
                {
                    "id": 17,
                    "nom": "Rétroviseur extérieur",
                    "prix": 60,
                    "categorie": "Carrosserie",
                    "Image": "image_retroviseur_exterieur.jpg",
                    "Disponible": false
                },
                {
                    "id": 18,
                    "nom": "Échappement complet",
                    "prix": 250,
                    "categorie": "Échappement",
                    "Image": "image_echappement_complet.jpg",
                    "Disponible": true
                },
                {
                    "id": 19,
                    "nom": "Vanne EGR",
                    "prix": 140,
                    "categorie": "Moteur",
                    "Image": "image_vanne_egr.jpg",
                    "Disponible": true
                },
                {
                    "id": 20,
                    "nom": "Turbo",
                    "prix": 400,
                    "categorie": "Moteur",
                    "Image": "image_turbo.jpg",
                    "Disponible": true
                },
                {
                    "id": 21,
                    "nom": "Joint de culasse",
                    "prix": 75,
                    "categorie": "Moteur",
                    "Image": "image_joint_culasse.jpg",
                    "Disponible": false
                },
                {
                    "id": 22,
                    "nom": "Boîtier de direction",
                    "prix": 300,
                    "categorie": "Direction",
                    "Image": "image_boîtier_direction.jpg",
                    "Disponible": true
                },
                {
                    "id": 23,
                    "nom": "Silent bloc de suspension",
                    "prix": 35,
                    "categorie": "Suspension",
                    "Image": "image_silent_bloc_suspension.jpg",
                    "Disponible": true
                },
                {
                    "id": 24,
                    "nom": "Cardan de transmission",
                    "prix": 160,
                    "categorie": "Transmission",
                    "Image": "image_cardan_transmission.jpg",
                    "Disponible": true
                },
                {
                    "id": 25,
                    "nom": "Capteur de position vilebrequin",
                    "prix": 50,
                    "categorie": "Moteur",
                    "Image": "image_capteur_position_vilebrequin.jpg",
                    "Disponible": true
                }
            ],
            panier : [],
            filtrePiece : '',
            categorie: '',
            filtrePrix: ''
            
        };
    },
    computed: {
        piecesFiltreesEtTriees() {
            let piecesFiltrees = this.pieces.filter(piece => {
                return (piece.categorie.indexOf(this.categorie) >= 0 || this.categorie === '') && (piece.nom.indexOf(this.filtrePiece) >= 0 || this.filtrePiece === '');
            });

            if (this.filtrePrix === 'croissant') {
                piecesFiltrees.sort((a, b) => a.prix - b.prix);
            } else if (this.filtrePrix === 'décroissant') {
                piecesFiltrees.sort((a, b) => b.prix - a.prix);
            }

            return piecesFiltrees;
        }
    },
    methods:{
        ajouterPanier(id,nom){
            this.panier.push({id,nom});
        }
    }
});


app.mount('#app');




