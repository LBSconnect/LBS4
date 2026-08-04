export interface Testimonial {
  initials: string;
  name: string;
  service: string;
  quote: string;
}

// Real Google reviews, shared across the homepage and service landing pages.
export const testimonials: Testimonial[] = [
  {
    initials: "KS",
    name: "Kelly Somes",
    service: "Google Review",
    quote:
      "I have no words to describe how great Linton Business Solutions was. The facility is clean, comfortable and very well managed. I was welcomed with a smile when I first walked in. Mr. Linton was so kind and welcoming — he definitely put me at ease. I had to take an exam and was very nervous. I've taken other tests at other testing centers and this was by far the best experience. Thank you Mr. Linton.",
  },
  {
    initials: "CF",
    name: "Cayla Fisch",
    service: "Google Review",
    quote:
      "They are absolutely amazing!!! So helpful in every way and literally my own personal cheerleaders!! They didn't let me give up and made sure I was gonna pass!! God send people and so thankful for them!!",
  },
  {
    initials: "KL",
    name: "Kel Living",
    service: "Google Review",
    quote:
      "I had a wonderful experience. Everyone was so nice. The process from setup all the way to pressing submit was great. They provide reassurance and speak positivity into you to help calm you before entering the testing area. And let's not forget the celebration they provide after you pass! Definitely will always be my site of choice!!! Thank you all for everything.",
  },
];
