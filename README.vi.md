<div align="center">

# LG TV Vibehack

**Màn hình chính kiểu Apple TV cho TV LG webOS, có nút Home thật, thời tiết và hình nền riêng.**

*LG TV-vibehack · webOS-vibehack · LG-vibehack: launcher thay thế màn hình Home đầy quảng cáo của LG.*

[![Release](https://img.shields.io/github/v/release/hoangvya19/lg-tv-webos-vibehack?style=flat-square)](https://github.com/hoangvya19/lg-tv-webos-vibehack/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![webOS](https://img.shields.io/badge/webOS-6%2B-a50034?style=flat-square)](#tv-đã-thử-nghiệm)

[English](README.md) · **Tiếng Việt**

<img src="docs/media/hero.jpg" alt="LG TV Vibehack chạy trên TV LG" width="860">

</div>

---

## Mục lục

- [Tính năng](#tính-năng)
- [Root hay không root?](#root-hay-không-root)
- [Cài trên TV đã root (khuyên dùng)](#cài-trên-tv-đã-root-khuyên-dùng)
- [Cài không cần root](#cài-không-cần-root)
- [Tuỳ chỉnh: hình nền, thời tiết, ngôn ngữ](#tuỳ-chỉnh-hình-nền-thời-tiết-ngôn-ngữ)
- [Cài thêm app từ Homebrew Channel](#cài-thêm-app-từ-homebrew-channel)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Gỡ cài đặt](#gỡ-cài-đặt)
- [Cảm ơn](#cảm-ơn)

## Tính năng

- **Giao diện gọn kiểu tvOS:** hàng dock ghim app, lưới app, và một khung kính lướt mượt giữa các ô.
- **Nút Home thật** (TV đã root): bấm Home trên remote là vào launcher, không qua Home của LG.
- **Đổi hình nền bằng điện thoại** (TV đã root): bấm nút hình ảnh, quét mã QR, chọn ảnh rồi cắt
  trong khung đúng tỉ lệ TV, có đánh dấu chỗ đồng hồ và hàng app sẽ nằm. Lấy ảnh từ USB cắm TV cũng được.
- **Thời tiết** theo thành phố, miễn phí, không cần tài khoản ([Open-Meteo](https://open-meteo.com)).
  Đổi thành phố ngay trên trang điện thoại đó, gõ tiếng Việt có dấu được.
- **Tiếng Việt hoặc tiếng Anh**, đồng hồ 12 h hoặc 24 h.
- **4 đến 10 ô mỗi hàng:** bấm cây bút cạnh hàng dock rồi chọn số.
- **Tự mở khi bật TV** (TV đã root), kể cả khi TV bật lên vào truyền hình.
- **Danh sách app tự cập nhật** (TV đã root): cài hay xoá app, khởi động lại TV là launcher tự cập nhật.
- **Sắp xếp app dễ dàng:** bấm cây bút cạnh dock → **Sắp xếp ứng dụng**, bấm vào app, trỏ tới chỗ mới
  rồi bấm lần nữa. Hoặc giữ OK trên 1 ô (dùng được cả con trỏ lẫn phím mũi tên).
- **Không theo dõi, không quảng cáo, không tài khoản.** Chỉ dùng HTML, CSS, JavaScript.

<p align="center">
  <img src="docs/media/home-button.gif" alt="Bấm Home vào thẳng launcher" width="420">
  <img src="docs/media/wallpaper-weather.jpg" alt="Hình nền và thời tiết" width="420">
</p>

## Root hay không root?

Cả hai đều dùng được. **Root cho trải nghiệm tốt hơn nhiều**, vì webOS chỉ cho app có quyền cao
đổi nút Home hoặc tự chạy khi bật TV.

| | TV đã root | Không root (Developer Mode) |
|---|:---:|:---:|
| Launcher có dock, lưới app, khung kính | ✅ | ✅ |
| Hình nền, thời tiết, ngôn ngữ, đồng hồ, số cột | ✅ | ✅ |
| Đổi hình nền, thành phố thời tiết **bằng điện thoại** (mã QR) | ✅ | ❌ sửa `config.js` |
| Cài bằng **1 lệnh**, không cần máy tính | ✅ | ❌ cần máy tính |
| **Nút Home** mở launcher | ✅ | ❌ (dùng phím tắt số) |
| Tự mở khi bật TV | ✅ | ❌ |
| Danh sách app tự cập nhật | ✅ | ❌ phải chạy lại trình cài |
| Dùng vĩnh viễn | ✅ | ⚠️ Developer Mode hết hạn, phải gia hạn |
| Chặn quảng cáo, theo dõi của LG (app *Life's Good Without Spying*) | ✅ | ❌ |
| Rủi ro cho TV | Thấp | Không có |

Chưa biết TV mình root được không? Xem **[rootmy.tv](https://rootmy.tv)** và
**[hướng dẫn root của webOS Homebrew](https://www.webosbrew.org/rooting/)**. Tuỳ phiên bản firmware.

## Cài trên TV đã root (khuyên dùng)

**Cần có:** TV LG đã root, có **Homebrew Channel**, và một điện thoại hoặc máy tính cùng Wi-Fi.

### 1. Bật SSH (làm 1 lần)

Trên TV, mở **Homebrew Channel → Settings (⚙)**, bật:

- **SSH Server**
- **Block system updates** (bản cập nhật của LG có thể làm mất root)

Kiểm tra **Root status** là **ok**, rồi bấm **System reboot**.

<img src="docs/media/homebrew-settings.jpg" alt="Cài đặt Homebrew Channel" width="300">

Xem IP của TV: **Cài đặt → Mạng → (Wi-Fi hoặc Có dây) → Nâng cao**. IP có dạng `192.168.1.50`.

### 2. (Tuỳ chọn) Cài LG Input Hook

Muốn **nút Home** mở thẳng launcher thì cài **LG Input Hook** từ Homebrew Channel và mở nó 1 lần.
Bỏ qua bước này vẫn cài được, chỉ là nút Home sẽ thoáng hiện Home LG rồi mới chuyển sang launcher.

### 3. Chạy 1 lệnh

Mở cửa sổ lệnh:

- **Windows 10/11:** bấm Start, gõ `Terminal` (hoặc `PowerShell`), Enter.
- **Mac:** bấm ⌘ + Space, gõ `Terminal`, Enter.
- **Điện thoại:** app SSH bất kỳ (ví dụ Termius).

Kết nối vào TV (thay bằng IP TV của bạn). Mật khẩu là `alpine` (khi gõ sẽ không hiện ký tự, cứ gõ rồi Enter):

```bash
ssh root@192.168.1.50
```

Dán lệnh này rồi Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/hoangvya19/lg-tv-webos-vibehack/main/install.sh | sh
```

Hiện chữ **Done** thì gõ `reboot`. Xong. 🎉

<details>
<summary><b>Cài luôn hình nền, thời tiết và tiếng Việt trong 1 lệnh</b></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/hoangvya19/lg-tv-webos-vibehack/main/install.sh | sh -s -- \
  --city "Ho Chi Minh City" --wallpaper https://example.com/anh-cua-ban.jpg --lang vi --clock24 on
```

Xem đủ tuỳ chọn ở phần [Tuỳ chỉnh](#tuỳ-chỉnh-hình-nền-thời-tiết-ngôn-ngữ).
</details>

> **Bảo mật:** mật khẩu root `alpine` không đổi được trên webOS (hệ thống chỉ đọc). Thay vào đó
> dùng SSH key như chính thông báo đăng nhập của TV khuyên: chạy `ssh-copy-id root@192.168.1.50`
> trên máy tính, rồi khởi động lại TV.

## Cài không cần root

**Cần có:** máy Mac hoặc Linux có [Node.js](https://nodejs.org) và [Python 3](https://www.python.org/downloads/),
cùng mạng với TV. (Windows: dùng [WSL](https://learn.microsoft.com/windows/wsl/install).)

1. **Bật Developer Mode.** Tạo tài khoản miễn phí tại [webostv.developer.lge.com](https://webostv.developer.lge.com).
   Trên TV, cài app **Developer Mode** từ LG Content Store, đăng nhập, bật **Dev Mode Status**
   (TV sẽ khởi động lại), mở lại app và bật **Key Server**.
2. **Tải project:** [Tải ZIP](https://github.com/hoangvya19/lg-tv-webos-vibehack/archive/refs/heads/main.zip) rồi giải nén.
3. **Chạy trình cài** trong cửa sổ lệnh, ở thư mục vừa giải nén:
   ```bash
   ./install-noroot.sh
   ```
   Trình cài hỏi IP của TV và passphrase hiện trong app Developer Mode, rồi tự cài.
   Bấm đồng ý khi TV hỏi.
4. **Tạo phím tắt:** khi đang mở launcher, giữ một phím số (ví dụ **1**) trên remote.
   Từ đó giữ phím 1 là mở launcher.

Mỗi lần cài hoặc xoá app, chạy lại `./install-noroot.sh`. Developer Mode sẽ hết hạn sau một
thời gian: thỉnh thoảng mở app Developer Mode và bấm **Extend**.

<details>
<summary><b>Tuỳ chọn: dùng nút Home mà không cần root</b></summary>

Cần một máy tính, Raspberry Pi hoặc NAS luôn bật, cùng mạng với TV:

```bash
python3 home-watch.py 192.168.1.50
```

Nó theo dõi TV và chuyển từ Home LG về launcher trong khoảng 0,1 giây.
Trên Mac: `TV_HOST=192.168.1.50 ./home-watch-mac.sh`.
</details>

## Tuỳ chỉnh: hình nền, thời tiết, ngôn ngữ

### TV đã root

**Dễ nhất: dùng điện thoại.** Trên launcher, bấm lên nút hình ảnh (giữa nút mạng và Cài đặt) rồi
bấm OK. Quét mã QR bằng camera điện thoại (điện thoại phải chung Wi-Fi với TV). Trang mở ra cho phép:

- **Chọn ảnh** trong điện thoại, rồi kéo và chụm 2 ngón để canh trong khung 16:9. Lưới và các ô
  viền nét đứt cho biết đồng hồ, các nút và hàng app sẽ che chỗ nào.
- **Làm tối** hoặc **xoá** hình nền.
- Chọn ảnh **từ USB** cắm vào TV.
- Đổi **thành phố thời tiết**: gõ tên (có dấu cũng được, ví dụ "Đà Lạt"), bấm đúng kết quả.

Mã QR có kèm khoá riêng, người khác dùng chung Wi-Fi không mở được trang nếu không có mã.

**Số ô mỗi hàng:** trên hàng dock, bấm sang phải qua app cuối để tới cây bút, bấm OK rồi chọn
từ 4 đến 10. Lựa chọn này lưu trên TV và được ưu tiên hơn `--columns`.

**Dùng dòng lệnh:** chạy lại đúng lệnh cài, thêm tuỳ chọn mong muốn. Cài đặt cũ được giữ nguyên.

```bash
curl -fsSL https://raw.githubusercontent.com/hoangvya19/lg-tv-webos-vibehack/main/install.sh | sh -s -- --city "Da Nang"
```

| Tuỳ chọn | Tác dụng |
|---|---|
| `--wallpaper URL` | Hình nền từ link trên mạng |
| `--wallpaper /tmp/usb/sda/sda1/anh.jpg` | …hoặc từ USB cắm vào TV |
| `--no-wallpaper` | Về nền đen |
| `--dim 0.5` | Làm tối hình nền (0 = giữ nguyên, 0.8 = rất tối). Mặc định 0.35 |
| `--glow off` | Tắt vầng sáng màu phía sau app đang chọn |
| `--city "Ho Chi Minh City"` | Thời tiết của thành phố này (dòng lệnh nên gõ tên tiếng Anh, không dấu) |
| `--fahrenheit` | Nhiệt độ theo °F |
| `--no-weather` | Ẩn thời tiết |
| `--lang vi` / `--lang en` | Tiếng Việt hoặc tiếng Anh |
| `--clock24 on` | Đồng hồ 24 giờ |
| `--columns 6` | Số ô mỗi hàng, từ 3 đến 10 (cây bút trên TV được ưu tiên hơn) |
| `--no-home-button` | Không đổi nút Home trên remote |

**Mẹo chọn hình nền:** dùng ảnh ngang (1920 × 1080). Để khuôn mặt ở 1/3 phía trên,
vì hàng dock và lưới app sẽ che nửa dưới.

**Icon app tuỳ chỉnh:** đặt file PNG mang tên ID app vào `/home/root/lg-tv-vibehack/icons/`
(ví dụ `netflix.png`) rồi khởi động lại TV. Logo nền trong suốt đẹp: [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons).
Xem ID app: `node /home/root/lg-tv-vibehack/sync.js --list`.

### Không root

Sửa file `app/config.js` (có chú thích từng dòng), rồi chạy lại `./install-noroot.sh`.
Hình nền: lưu ảnh thành `app/bg.jpg` và đặt `wallpaper: 'bg.jpg'`.
Thời tiết: đặt `enabled: true` cùng toạ độ (trên Google Maps, giữ tay lên vị trí nhà bạn,
hai con số hiện ra là vĩ độ và kinh độ).

## Cài thêm app từ Homebrew Channel

Mở **Homebrew Channel**, chọn app, bấm **Install**. Launcher sẽ hiện app mới sau lần khởi động lại kế tiếp.

| App | Dùng để | Cần root |
|---|---|:---:|
| **Kodi** | Xem phim từ USB, mạng LAN hoặc add-on | Không |
| **Jellyfin** | Xem kho phim riêng trên PC/NAS chạy Jellyfin | Không |
| **PlxNative** | App Plex chạy nhanh (app Plex chính thức cũng có trong LG Content Store) | Không |
| **Moonlight** | Chơi game stream từ PC, độ trễ thấp | Không |
| **YouTube AdFree** | YouTube không quảng cáo, có SponsorBlock. Gỡ YouTube chính thức trước khi cài | Không |
| **Life's Good Without Spying** | Chặn quảng cáo, theo dõi ACR và gửi dữ liệu của LG | Có |
| **LG Input Hook** | Đổi chức năng nút remote (dùng cho nút Home ở đây) | Có |

**Stremio** không có trong Homebrew Channel. Hãy tìm trong **LG Content Store**; có hay không tuỳ
quốc gia và đời TV.

Cập nhật app Homebrew: mở app đó trong Homebrew Channel và bấm **Update**. Homebrew Channel lấy app
từ kho riêng, nên có thể chậm hơn bản mới nhất trên GitHub một chút.

## Xử lý sự cố

<details>
<summary><b>Lưới app trống hoặc màn hình đen</b></summary>

TV đã root: chạy `node /home/root/lg-tv-vibehack/sync.js` qua SSH rồi mở lại launcher.
Không root: chạy lại `./install-noroot.sh`.
</details>

<details>
<summary><b>Bấm Home vẫn ra Home của LG</b></summary>

1. Đã cài **LG Input Hook** và mở nó 1 lần chưa? Cài xong thì chạy lại lệnh cài.
2. Khởi động lại TV 1 lần sau khi cài.
3. Kiểm tra watcher: `ps -ef | grep homewatch` phải thấy một tiến trình `node`.
4. Xem log: `tail -30 /tmp/lg-tv-vibehack.log`
</details>

<details>
<summary><b>Bấm Home không có phản ứng gì</b></summary>

LG Input Hook đã bắt được phím nhưng lệnh lỗi. Kiểm tra:
`cat /home/root/.config/lginputhook/keybinds.json` phải có
`/home/root/lg-tv-vibehack/golauncher.sh`. Chạy lại lệnh cài để sửa.
</details>

<details>
<summary><b>Bấm nút hình ảnh báo "Trang đổi hình nền chưa chạy"</b></summary>

Trang này chạy khoảng 30 giây sau khi bật TV, đợi chút rồi thử lại. Vẫn lỗi thì kiểm tra:
`ps -ef | grep wallpaper-server` phải có một tiến trình `node`, còn `tail -30 /tmp/lg-tv-vibehack.log`
cho biết lý do. Chạy lại lệnh cài sẽ khởi động lại nó.
</details>

<details>
<summary><b>Điện thoại không mở được trang từ mã QR</b></summary>

Điện thoại phải chung mạng với TV (không dùng 4G). Nếu IP của TV đổi, bấm lại nút hình ảnh để có
mã QR mới. Mẹo: đặt IP cố định cho TV trong router (DHCP reservation).
</details>

<details>
<summary><b>Báo "Could not download…" hoặc không hiện thời tiết</b></summary>

TV không ra được Internet. Thử trên TV: `curl -sI https://github.com`.
</details>

<details>
<summary><b>Thoát YouTube, Netflix mất 2–3 giây mới về launcher</b></summary>

Bình thường với TV ít RAM: app nặng đẩy launcher ra khỏi bộ nhớ, nên nó phải tải lại.
</details>

<details>
<summary><b>App đã xoá vẫn còn icon</b></summary>

TV đã root: icon tự mất sau lần khởi động lại (hoặc chạy `sync.js`). Không root: chạy lại trình cài.
</details>

Vẫn chưa được? [Tạo issue](https://github.com/hoangvya19/lg-tv-webos-vibehack/issues/new/choose)
kèm model TV, ảnh chụp màn hình và log.

## Gỡ cài đặt

**TV đã root:**
```bash
curl -fsSL https://raw.githubusercontent.com/hoangvya19/lg-tv-webos-vibehack/main/install.sh | sh -s -- --uninstall
reboot
```

**Không root:** trên TV, mở danh sách app, chọn **Home** và xoá.

## TV đã thử nghiệm

| Model | webOS | Chế độ | Trạng thái |
|---|---|---|---|
| 55NANO77TPA | 6 (firmware 03.51.15) | Root | ✅ |
| OLED55C6XLA | 26 | Không root | ✅ |

Bạn đã thử trên TV khác? Tạo issue hoặc pull request để bổ sung vào bảng.

## Cảm ơn

Project này được xây trên công sức của nhiều người. Xin cảm ơn:

- **[Gathin23/tv-vibehack](https://github.com/Gathin23/tv-vibehack)**: launcher kiểu Apple TV gốc cho Android TV.
- **[webOS Homebrew Project](https://www.webosbrew.org)**: Homebrew Channel, công cụ root và kho app.
- **[RootMyTV](https://rootmy.tv)**: giúp root được TV LG.
- **[Simon34545/lginputhook](https://github.com/Simon34545/lginputhook)**: đổi chức năng nút remote.
- **[Open-Meteo](https://open-meteo.com)**: API thời tiết và tìm toạ độ miễn phí.
- Font **[Outfit](https://fonts.google.com/specimen/Outfit)** (SIL Open Font License).
- Thực hiện cùng **[Claude](https://claude.ai)** của Anthropic.

## Ủng hộ

Nếu project giúp TV của bạn đẹp hơn, một ⭐ cho repo sẽ giúp người khác tìm thấy nó.

Muốn mời mình ly cà phê? Ủng hộ bằng **USDT mạng BNB Smart Chain (BEP20)**:

<img src="docs/media/donate-usdt-bsc.gif" alt="Mã QR địa chỉ ủng hộ USDT BEP20" width="180">

```
0x11a0cd4c3e0135d2af5dc0ad0d44bc535fe4645b
```

⚠️ Chỉ gửi **USDT trên mạng BNB Smart Chain (BEP20)**. Gửi nhầm mạng khác sẽ mất tiền.

## Miễn trừ trách nhiệm

Root và chỉnh sửa TV là rủi ro của bạn và có thể ảnh hưởng bảo hành. Project này không sửa phân vùng
hệ thống; mọi thứ cài vào đều gỡ được bằng `--uninstall`. LG, webOS và tên các app là thương hiệu của
chủ sở hữu tương ứng. Project không liên quan đến LG Electronics.

## Giấy phép

[MIT](LICENSE). Có sử dụng mã nguồn từ tv-vibehack và webos-vibehack, cũng theo giấy phép MIT.
