/** Cover images for classroom cards (Stitch design assets) */
export const CLASSROOM_COVER_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDtZd6Qjxcc6dmK19Xw3T59grKFMqH9kBYEu4zrZWH0cUAfoDJx_3bVOTZn2FCVtUqyJAL7TVwL2Qpyieb9tQ6CwiEh3WLB-oStUFPgvlSjxU6FAIWCE_GL83M3osmJaVN4b-21rg9VkKl4EA-QyXXcGr3nLZOjuMcXhGvM7XxGmrXpSwAs-CZXpcji-yE7iAwZMrqHSOtlo-KYvrSk4gLFmPA8c0emuDDoNN7xWL6UFF00MCpj2W0ijWxmzXEvdljjNmR8YRgwivg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCc4hzYQaKIavucCxEc6SSFlgxMyWBjv4PrhZg24uyF5tyeUyJ3D58af2axTUqz--DfVGwFNW14au1Ap-kntBB25rLymiDKzy7hAKl_183jsChojNSqhdHhngp9svnYdydw5Pmdg3kSM7QDFkiIV6JqqOj2iO6bXDs7pbsZU5MPn5bAi3Fmm2Pk3n4iENuLq-QFw7QfFx92H0cBrAksCe6lOtiOd3NePRFo_lyXIXW7JWajpUjblVEn_q4nlHXhZo2KiT-VDqwDNZs",
] as const;

export const OFFICER_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAWqMZoNhWTa1lix2YN6mBkJAkY_RIeWWbfxapbv-04ZIQVam_HDFfETOsVAwW8McklQ3RSd3hl7eiqJXzev8iDPtfUl2l1MPvQ3qyz78in_kE4h_4cwoQv79idXOxjgmCYFi6mKSTfMuX9UJGG1NsFuW68sVG2IhCcBiwpf1s38Oag6GxCoREX0HUv79wqp2ooklDAha2f5c3xNzWUcJU8d08ttHYX5s7LlBMA45CI2cWN2Pe9TivRws-DgeMuaFgug05rM1l_h8k";

export function getSubjectBadge(subject: string | null): {
  label: string;
  className: string;
} {
  const key = (subject ?? "").toLowerCase();
  if (key.includes("lab") || key.includes("biology"))
    return {
      label: "Lab",
      className: "bg-[#d0e1fb] text-[#54647a]",
    };
  if (key.includes("engineering") || key.includes("computer"))
    return {
      label: "Advanced",
      className: "bg-[#2563eb] text-white",
    };
  return {
    label: "Course",
    className: "bg-[#2563eb] text-white",
  };
}

export function getClassroomCover(index: number): string {
  return CLASSROOM_COVER_IMAGES[index % CLASSROOM_COVER_IMAGES.length];
}
